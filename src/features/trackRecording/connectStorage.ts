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
import { setLineSelected } from '../lines/slice';
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
						store.dispatch(setIsRecordingAction(newSettings.isRecording));
					} else if (!newSettings.isRecording) {
						store.dispatch(setIsRecordingAction(newSettings.isRecording));
					}
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
		setRecordingStartTime
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
 */
startAppListening({
	actionCreator: writeGnssPosition,
	effect: async (action, listenerApi) => {
		const state = listenerApi.getState();
		const trk = state.trackRecording;

		if (!trk.isRecording) {
			return;
		}

		if (!dbConnection?.drizzle) {
			return;
		}

		const { lng, lat, altitude } = action.payload;
		const coord: [
			number,
			number,
			number?,
		] =
			altitude != null
				? [
						lng,
						lat,
						altitude,
					]
				: [lng, lat];

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
				  ] =>
				c[2] != null
					? [
							c[0],
							c[1],
							c[2],
						]
					: [c[0], c[1]];

			let result:
				| {
						id: number;
				  }[]
				| undefined;
			try {
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
			return;
		}

		// Update state so other UI can track the last-written position.
		listenerApi.dispatch(setLastWrittenPosition(coord));
		listenerApi.dispatch(setLastWrittenTime(Date.now()));

		try {
			await appendPointToLine(trk.activeLineId, coord);
		} catch (err) {
			logError('trackRecording/appendPoint', err);
		}
	},
});
