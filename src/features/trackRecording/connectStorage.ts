/**
 * External dependencies
 */
import { isAnyOf } from '@reduxjs/toolkit';
import DefaultPreference from 'react-native-default-preference';
import { get, isEqual, set } from 'lodash-es';
import type { GnssPosition } from 'react-native-mapsforge-vtm';

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
	setLastRecordedLineId,
	setMinDistance,
	setMinTime,
	setMinPrecision,
	setLineWidth,
	setInitialized,
	setLastWrittenPosition,
	setLastWrittenTime,
	setLastWrittenMeta,
	setRecordingStartTime,
	setResumePending,
	setResumePromptPending,
	setUseDemAltitude,
	setPausedLineId,
	stopRecording,
	writeGnssPosition,
} from './slice';
// GNSS positions come from the native GnssModule (application-scoped)
// as device events — the controller in gnss/gnssModuleController.ts
// forwards them to this listener and the gnss slice.
// The listener below watches writeGnssPosition to append points to the active line.
import { startAppListening } from '../../store/listenerMiddleware';
import { selectInitialized } from './selectors';
import { AppStore } from '../../store/store';
import { logError } from '../../lib/utils';
import { appendPointToLine, createTrack } from './db/actionsTrack';
import { insertTrackPoint, insertTrackPoints } from './db/actionsTrackPoints';
import { TrackPointInput, TrackPointMeta } from './types';
import { createLines } from '../lines/db/actionsLine';
import { ensureTagByLabel } from '../lines/db/actionsTag';
import { setLineSelected, setSelected } from '../lines/slice';
import { setIsActive } from '../gnss/slice';
import { startRecordingTask, stopRecordingTask } from './backgroundTask';
import { deriveSpeedMps, toTrackCoord } from './utils';
import {
	invalidateLineTrackPointsQueries,
	invalidateTrackSummaryQueries,
	queryLastRecordedLine,
	queryLinePointCount,
} from './db/queryFns';
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
 * Seed the drawer's "last recording" pointer from the DB — used once
 * for legacy installs whose persisted settings predate the field. Never
 * runs when the key is present in storage (including an explicit null),
 * so a deliberate delete isn't undone by re-seeding on restart.
 */
const seedLastRecordedLineId = (store: AppStore) => {
	if (!dbConnection?.drizzle) {
		return;
	}
	queryLastRecordedLine()
		.then((id) => store.dispatch(setLastRecordedLineId(id)))
		.catch((err) => logError('trackRecording/seedLastRecordedLineId', err));
};

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
				if (typeof newSettings.lineWidth === 'number') {
					store.dispatch(setLineWidth(newSettings.lineWidth));
				}
				if (typeof newSettings.recordingStartTime === 'number') {
					store.dispatch(setRecordingStartTime(newSettings.recordingStartTime));
				}
				// Restore the drawer's "last recording" pointer. The key
				// is always persisted (even when null), so a stored null
				// means "deliberately cleared" — never re-seed. Only
				// legacy settings (pre-field) seed from the DB.
				if (Object.prototype.hasOwnProperty.call(newSettings, 'lastRecordedLineId')) {
					store.dispatch(
						setLastRecordedLineId(
							typeof newSettings.lastRecordedLineId === 'number'
								? newSettings.lastRecordedLineId
								: null
						)
					);
				} else {
					seedLastRecordedLineId(store);
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
	// Always persist the last-recorded pointer — including null, which
	// marks a deliberate delete (see initializeFromStorage). The loop
	// above skips null because it matches the initial value.
	set(settingsToSave, 'lastRecordedLineId', get(state, 'lastRecordedLineId') ?? null);
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
		setLastRecordedLineId,
		setMinDistance,
		setMinTime,
		setMinPrecision,
		setLineWidth,
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
 * Each qualifying fix writes two things: the geometry append (critical
 * path, ST_AddPoint) and — best-effort — a track_points metadata row
 * (fix timestamp, derived segment speed, accuracy, bearing, raw GNSS
 * altitude and its provenance).  Geometry first: a crash between the
 * two writes leaves a tolerated trailing gap in the metadata table,
 * never a misalignment (point_index is anchored to the geometry).
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

// Geometry-anchored index of the next appended point (0-based, matching
// lines.geometry coordinates).  Seeded once per active line via
// ST_NPoints.  Advances with the geometry (even when a metadata insert
// fails), so track_points can only ever be behind the geometry, never
// misaligned with it.
let nextPointIndex: number | null = null;
let seededLineId: number | null = null;
// Set when the ST_NPoints seed query fails — disables metadata writes
// for the rest of the session instead of re-querying per fix.
let seedingFailed = false;

const toMeta = (payload: GnssPosition): TrackPointMeta => ({
	timestamp: payload.timestamp,
	gnssAltitude: payload.gnssAltitude,
	elevationSource: payload.elevationSource,
	accuracy: payload.accuracy,
	bearing: payload.bearing,
});

const toTrackPointInput = (
	trackId: number,
	lineId: number,
	pointIndex: number,
	meta: TrackPointMeta,
	speed: number | null
): TrackPointInput => ({
	track_id: trackId,
	line_id: lineId,
	point_index: pointIndex,
	timestamp: meta.timestamp,
	gnss_altitude: meta.gnssAltitude,
	elevation_source: meta.elevationSource,
	accuracy: meta.accuracy,
	bearing: meta.bearing,
	speed,
});

/** Defensive fallback when a buffered fix has no captured metadata (the
 * listener always buffers position and meta together, so this only ever
 * guards against a future refactor dropping one without the other). */
const toFallbackMeta = (): TrackPointMeta => ({
	timestamp: Date.now(),
	gnssAltitude: null,
	elevationSource: 'none',
	accuracy: 0,
	bearing: -1,
});

const processWriteGnssPosition = async (
	action: { payload: GnssPosition },
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

	const payload = action.payload;
	const { lng, lat, altitude } = payload;
	// Always 3D — a mixed 2D/3D LineString breaks ST_AddPoint.
	const coord = toTrackCoord(lng, lat, altitude);
	const meta = toMeta(payload);

	if (!trk.activeLineId) {
		const buffered = trk.lastWrittenPosition;
		if (!buffered) {
			// First position — buffer it, create the line on the next.
			listenerApi.dispatch(setLastWrittenPosition(coord));
			listenerApi.dispatch(setLastWrittenMeta(meta));
			listenerApi.dispatch(setLastWrittenTime(Date.now()));
			return;
		}

		// Second position — create the track line from both points.
		const bufferedMeta = trk.lastWrittenMeta ?? toFallbackMeta();
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

		const trackId = trackResult.id;

		// Persist metadata for the two creation points.  Best-effort —
		// geometry is the critical path; a failure leaves a gap that a
		// later task can backfill from the remaining data.
		try {
			await insertTrackPoints([
				toTrackPointInput(trackId, lineId, 0, bufferedMeta, null),
				toTrackPointInput(
					trackId,
					lineId,
					1,
					meta,
					deriveSpeedMps(
						{
							lng: buffered[0],
							lat: buffered[1],
							timestamp: bufferedMeta.timestamp,
						},
						{ lng, lat, timestamp: meta.timestamp }
					)
				),
			]);
		} catch (err) {
			logError('trackRecording/insertTrackPoints', err);
		}
		nextPointIndex = 2;
		seededLineId = lineId;

		listenerApi.dispatch(setActiveTrackId(trackId));
		listenerApi.dispatch(setActiveLineId(lineId));
		// Auto-select the line so it appears in the drawer list.
		listenerApi.dispatch(setLineSelected(lineId, true));
		listenerApi.dispatch(setLastWrittenPosition(coord));
		listenerApi.dispatch(setLastWrittenMeta(meta));
		listenerApi.dispatch(setLastWrittenTime(Date.now()));

		// Refresh line caches so the new line shows up immediately.
		const queryClient = dbConnection?.queryClient;
		if (queryClient) {
			invalidateLinesQueries(queryClient);
			invalidateLineGeomQueries(queryClient);
			invalidateLineTrackPointsQueries(queryClient);
		}
		return;
	}

	// Seed the point index once per active line — new, continued and
	// resumed sessions all funnel through here.  The geometry is the
	// anchor: the next appended coordinate lands at ST_NPoints,
	// regardless of whether track_points has trailing gaps.
	if (seededLineId !== trk.activeLineId) {
		// Different line than the cached index — re-seed from its
		// geometry.
		nextPointIndex = null;
		seedingFailed = false;
	}
	if (nextPointIndex == null && !seedingFailed) {
		const seeded = await queryLinePointCount(trk.activeLineId);
		if (seeded == null) {
			// Metadata writes stay disabled for this session — geometry
			// recording is unaffected.
			seedingFailed = true;
			logError('trackRecording/seedPointIndex', new Error('ST_NPoints returned no count'));
		}
		nextPointIndex = seeded;
	}
	seededLineId = trk.activeLineId;

	// Snapshot the previous point (from the state captured at event
	// time, before this write updates it) for speed derivation.
	const prevMeta = trk.lastWrittenMeta;
	const prevPosition = trk.lastWrittenPosition;

	// Update state so other UI can track the last-written position.
	listenerApi.dispatch(setLastWrittenPosition(coord));
	listenerApi.dispatch(setLastWrittenMeta(meta));
	listenerApi.dispatch(setLastWrittenTime(Date.now()));

	try {
		await appendPointToLine(trk.activeLineId, coord);
	} catch (err) {
		logError('trackRecording/appendPoint', err);
		return;
	}

	// Metadata write is best-effort and strictly after the geometry
	// append.  The index advances with the geometry (even when the
	// insert is skipped — e.g. the track id is still resolving during a
	// continueRecording — or fails), so the table can only ever trail
	// the geometry, never misalign with it.
	if (nextPointIndex != null && trk.activeTrackId != null) {
		const speed =
			prevMeta && prevPosition
				? deriveSpeedMps(
						{
							lng: prevPosition[0],
							lat: prevPosition[1],
							timestamp: prevMeta.timestamp,
						},
						{ lng, lat, timestamp: meta.timestamp }
					)
				: null;
		try {
			await insertTrackPoint(
				toTrackPointInput(trk.activeTrackId, trk.activeLineId, nextPointIndex, meta, speed)
			);
		} catch (err) {
			logError('trackRecording/insertTrackPoint', err);
		}
	}
	if (nextPointIndex != null) {
		nextPointIndex += 1;
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
		invalidateLineTrackPointsQueries(queryClient);
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
		// Unconditionally remove the recording foreground task.  Without
		// this, a task registered while resumePending (confirmRecordingResume,
		// before the first GNSS fix) survives GNSS being switched off and
		// the notification lingers.  Idempotent — no-op when no task is
		// registered (stopRecording already unregisters when isRecording).
		stopRecordingTask();
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
			invalidateLineTrackPointsQueries(queryClient);
			invalidateTrackSummaryQueries(queryClient);
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

/**
 * Listener 6: releasing the parked recording line ends the paused
 * recording mode.  Removing the paused line from the map (toggle, table,
 * bulk actions, delete, clear — all converge on lines/setSelected)
 * parks nothing; re-adding it renders it as a normal line.
 *
 * Removing the last recorded line from the map also releases the
 * drawer's idle "last recording" state (stats + Continue-last menu) —
 * only on an actual removal though: a legacy-seeded pointer whose line
 * simply isn't on the map must survive unrelated map toggles.
 */
startAppListening({
	actionCreator: setSelected,
	effect: (_action, listenerApi) => {
		const prevSelected = listenerApi.getOriginalState().lines.selected;
		const { pausedLineId, lastRecordedLineId } = listenerApi.getState().trackRecording;
		const { selected } = listenerApi.getState().lines;
		if (pausedLineId != null && !selected.includes(pausedLineId)) {
			listenerApi.dispatch(setPausedLineId(null));
		}
		if (
			lastRecordedLineId != null &&
			prevSelected.includes(lastRecordedLineId) &&
			!selected.includes(lastRecordedLineId)
		) {
			listenerApi.dispatch(setLastRecordedLineId(null));
		}
	},
});
