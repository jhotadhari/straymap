/**
 * External dependencies
 */
import { isAnyOf } from '@reduxjs/toolkit';
import DefaultPreference from 'react-native-default-preference';
import { get, isEqual, set } from 'lodash-es';

/**
 * Internal dependencies
 */
import {
	TrackRecordingSettings,
	TrackRecordingState,
	initialSettings,
	setIsRecordingAction,
	setActiveTrackId,
	setActiveLineId,
	setMinDistance,
	setMinTime,
	setMinPrecision,
	setInitialized,
	setLastWrittenPosition,
	setLastWrittenTime,
	setRecordingStartTime,
	setResumePending,
	setResumePromptPending,
	setUseDemAltitude,
	stopRecording,
	writeGnssPosition,
} from './slice';
// GNSS positions come from the native gnssFilter on MapContainer.
// The listener below watches writeGnssPosition to append points to the active line.
import { startAppListening } from '../../store/listenerMiddleware';
import { selectInitialized } from './selectors';
import { AppStore } from '../../store/store';
import { logError } from '../../lib/utils';
import { appendPointToLine, createTrack } from './db/actionsTrack';
import { createLines } from '../lines/db/actionsLine';
import { ensureTagByLabel } from '../lines/db/actionsTag';
import { setLineSelected } from '../lines/slice';
import { setIsActive } from '../gnss/slice';
import { startRecordingTask } from './backgroundTask';
import { toTrackCoord } from './utils';
import { invalidateLastRecordedLineQueries } from './db/queryFns';
import { setActiveKey } from '../bottomDrawer/slice';
import { getChartSourceKey } from '../chart/types';
import { selectFollowingLineId } from '../lineFollow/selectors';
import {
	invalidateLineGeomQueries,
	invalidateLineGeomQueriesForLine,
	invalidateLinesQueries,
} from '../lines/db/queryFns';
import { dbConnection } from '../dbLoader/DBConnection';

const settingsKey = 'trackRecordingSettings';

/**
 * Load settings from DefaultPreference and dispatch to the store.
 */
export const initializeFromStorage = (store: AppStore) => {
	if (selectInitialized(store.getState())) {
		return;
	}
	DefaultPreference.get(settingsKey)
		.then((newSettingsStr) => {
			if (newSettingsStr) {
				const newSettings = JSON.parse(newSettingsStr) as Partial<TrackRecordingState>;
				if (typeof newSettings.isRecording === 'boolean') {
					// Only restore if the DB connection is ready and the
					// referenced line still exists.  Otherwise a stale
					// recording flag will trigger cascading write failures.
					if (
						newSettings.isRecording &&
						dbConnection?.drizzle &&
						typeof newSettings.activeLineId === 'number'
					) {
						// The app was killed while recording was active —
						// show the resume prompt (ResumeRecordingPrompt
						// overlay) instead of silently re-activating.
						store.dispatch(setResumePromptPending(true));
					} else if (!newSettings.isRecording) {
						store.dispatch(setIsRecordingAction(newSettings.isRecording));
					}
				}
				// Killed while a confirmed resume was waiting for its
				// first GNSS fix — prompt again.
				if (newSettings.resumePending === true) {
					store.dispatch(setResumePromptPending(true));
				}
				if (typeof newSettings.useDemAltitude === 'boolean') {
					store.dispatch(setUseDemAltitude(newSettings.useDemAltitude));
				}
				if (typeof newSettings.activeTrackId === 'number') {
					store.dispatch(setActiveTrackId(newSettings.activeTrackId));
				}
				if (typeof newSettings.activeLineId === 'number') {
					store.dispatch(setActiveLineId(newSettings.activeLineId));
				}
				if (typeof newSettings.minDistance === 'number') {
					store.dispatch(setMinDistance(newSettings.minDistance));
				}
				if (typeof newSettings.minTime === 'number') {
					store.dispatch(setMinTime(newSettings.minTime));
				}
				if (typeof newSettings.minPrecision === 'number') {
					store.dispatch(setMinPrecision(newSettings.minPrecision));
				}
				if (typeof newSettings.recordingStartTime === 'number') {
					store.dispatch(setRecordingStartTime(newSettings.recordingStartTime));
				}
			}
			store.dispatch(setInitialized(true));
		})
		.catch((err) => logError('trackRecording/connectStorage', err));
};

/**
 * Persist settings that differ from initialSettings to DefaultPreference.
 */
export const saveToStorage = (state: TrackRecordingState, _actionType: string) => {
	if (!state.initialized) {
		return;
	}
	const settingsToSave: Partial<TrackRecordingSettings> = {};
	Object.keys(initialSettings).forEach((key) => {
		const valueToSave = get(state, key);
		const shouldSave = !isEqual(valueToSave, get(initialSettings, key));
		if (shouldSave) {
			set(settingsToSave, key, valueToSave);
		}
	});
	return DefaultPreference.set(settingsKey, JSON.stringify(settingsToSave));
};

/**
 * Listener 1: Persist settings on change.
 */
startAppListening({
	matcher: isAnyOf(
		setIsRecordingAction,
		setActiveTrackId,
		setActiveLineId,
		setMinDistance,
		setMinTime,
		setMinPrecision,
		setRecordingStartTime,
		setResumePending,
		setUseDemAltitude
	),
	effect: async (action, listenerApi) => {
		try {
			await saveToStorage(listenerApi.getState().trackRecording, action.type);
		} catch (err) {
			logError('saveToStorage', err);
		}
	},
});

/**
 * Listener 2: GNSS filter write-back.
 * Watches writeGnssPosition (dispatched from the native onGnssPosition
 * callback on MapContainer).  Filtering (distance, time, accuracy) and
 * altitude resolution are handled natively — this listener only writes
 * to the DB.
 *
 * Lazy line creation: a single-point LineString is invalid GeoJSON
 * (SpatiaLite's GeomFromGeoJSON rejects it), so the first position is
 * buffered and the track line is created from the first two positions.
 *
 * Writes are serialized through a promise chain: the creation branch
 * awaits several DB round-trips, and two positions arriving inside that
 * window must not both spawn a line (duplicate orphaned tracks).
 */
let writeChain: Promise<void> = Promise.resolve();

const processWriteGnssPosition = async (
	action: { payload: { lng: number; lat: number; altitude: number | null } },
	listenerApi: {
		dispatch: (action: any) => void;
		getState: () => { trackRecording: TrackRecordingState };
	}
) => {
	let state = listenerApi.getState();
	const trk = state.trackRecording;

	if (!trk.isRecording && !trk.resumePending) {
		return;
	}

	// Deferred resume: recording was restored from storage — only
	// re-activate on the first native position, then register the
	// foreground task that keeps it alive in the background.
	if (trk.resumePending) {
		listenerApi.dispatch(setResumePending(false));
		listenerApi.dispatch(setIsRecordingAction(true));
		listenerApi.dispatch(setIsActive(true));
		await startRecordingTask();
		state = listenerApi.getState();
	}

	if (!dbConnection?.drizzle) {
		return;
	}

	const { lng, lat, altitude } = action.payload;
	// Always 3D — a mixed 2D/3D LineString breaks ST_AddPoint.
	const coord = toTrackCoord(lng, lat, altitude);

	if (!trk.activeLineId) {
		const buffered = trk.lastWrittenPosition;
		if (!buffered) {
			// First position — buffer it, create the line on the next.
			listenerApi.dispatch(setLastWrittenPosition(coord));
			listenerApi.dispatch(setLastWrittenTime(Date.now()));
			return;
		}

		// Second position — create the track line from both points.
		const settings = {
			minDistance: trk.minDistance,
			minTime: trk.minTime,
			minPrecision: trk.minPrecision,
		};
		const toPosition = (
			c: [
				number,
				number,
				number?,
			]
		):
			| [number, number]
			| [
					number,
					number,
					number,
			  ] => toTrackCoord(c[0], c[1], c[2]);

		let result:
			| {
					id: number;
			  }[]
			| undefined;
		try {
			// Attach the system 'recorded' tag (red) to the track line.
			let recordedTagId: number | undefined;
			try {
				recordedTagId = await ensureTagByLabel('recorded');
			} catch (err) {
				// Tagging is non-critical — recording must not die
				// over a tag failure.
				logError('trackRecording/ensureRecordedTag', err);
			}
			result = await createLines([
				{
					title: null,
					lineStringFeature: {
						type: 'Feature',
						properties: {},
						geometry: {
							type: 'LineString',
							coordinates: [toPosition(buffered), toPosition(coord)],
						},
					},
					tagIds: recordedTagId !== undefined ? [recordedTagId] : [],
				},
			]);
		} catch (err) {
			// Creation failed — keep the buffer and retry on the next
			// position.
			logError('trackRecording/createLine', err);
			return;
		}

		if (!result?.length) {
			return;
		}

		const lineId = result[0].id;

		const trackResult = await createTrack({
			line_id: lineId,
			settings,
		});

		if (!trackResult?.id) {
			// Clean up the orphaned line — createTrack failed after
			// createLines committed. TODO: add deleteLine call once a
			// non-throwing version is available.
			return;
		}

		listenerApi.dispatch(setActiveTrackId(trackResult.id));
		listenerApi.dispatch(setActiveLineId(lineId));
		// Auto-select the line so it appears in the drawer list.
		listenerApi.dispatch(setLineSelected(lineId, true));
		listenerApi.dispatch(setLastWrittenPosition(coord));
		listenerApi.dispatch(setLastWrittenTime(Date.now()));

		// Refresh line caches so the new line shows up immediately.
		const queryClient = dbConnection?.queryClient;
		if (queryClient) {
			invalidateLinesQueries(queryClient);
			invalidateLineGeomQueries(queryClient);
			invalidateLastRecordedLineQueries(queryClient);
		}
		return;
	}

	// Update state so other UI can track the last-written position.
	listenerApi.dispatch(setLastWrittenPosition(coord));
	listenerApi.dispatch(setLastWrittenTime(Date.now()));

	try {
		await appendPointToLine(trk.activeLineId, coord);
	} catch (err) {
		logError('trackRecording/appendPoint', err);
		return;
	}

	// The geometry changed — refetch so the map line, point count and
	// distance grow live instead of staying frozen at creation time
	// (React Query staleTime is Infinity).  Only the active line's
	// per-line cache is invalidated — never the lineGeomsBatch queries
	// (their Simplify over all selected lines must not re-run per
	// append, e.g. with thousands of lines loaded).
	const queryClient = dbConnection?.queryClient;
	if (queryClient) {
		invalidateLineGeomQueriesForLine(queryClient, trk.activeLineId);
		// The chart/follow consumers read the simplified `linePathCoords`
		// query — keep it live too so the tracking chart grows per append.
		queryClient.invalidateQueries({ queryKey: ['linePathCoords', trk.activeLineId] });
	}
};

startAppListening({
	actionCreator: writeGnssPosition,
	effect: (action, listenerApi) => {
		writeChain = writeChain
			.catch((err) => logError('trackRecording/writeChain', err))
			.then(() => processWriteGnssPosition(action, listenerApi));
	},
});

/**
 * Listener 3: GNSS switched off stops the recording.  Stop and pause
 * are the same — any recorded line can be continued later.  A pending
 * restore-resume is cancelled as well (no GNSS, no recording).
 */
startAppListening({
	actionCreator: setIsActive,
	effect: (action, listenerApi) => {
		if (action.payload) {
			return;
		}
		const trk = listenerApi.getState().trackRecording;
		if (trk.isRecording) {
			listenerApi.dispatch(stopRecording());
		}
		if (trk.resumePending) {
			listenerApi.dispatch(setResumePending(false));
		}
	},
});

/**
 * Listener 4: recording stopped — refresh line caches so list stats and
 * geometry reflect the final state (appends only invalidated lineGeom
 * while recording).
 */
startAppListening({
	actionCreator: setIsRecordingAction,
	effect: (action, _listenerApi) => {
		if (action.payload) {
			return;
		}
		const queryClient = dbConnection?.queryClient;
		if (queryClient) {
			invalidateLinesQueries(queryClient);
			invalidateLineGeomQueries(queryClient);
			invalidateLastRecordedLineQueries(queryClient);
		}
	},
});

/**
 * Listener 5: auto-select the tracking line's chart when the recording
 * line comes into existence (the drawer itself stays closed). Following
 * takes priority — while a line is followed the tracking chart is added
 * but not selected.
 */
startAppListening({
	actionCreator: setActiveLineId,
	effect: (action, listenerApi) => {
		if (action.payload == null) {
			return;
		}
		if (selectFollowingLineId(listenerApi.getState()) != null) {
			return;
		}
		listenerApi.dispatch(setActiveKey(getChartSourceKey.line(action.payload)));
	},
});
