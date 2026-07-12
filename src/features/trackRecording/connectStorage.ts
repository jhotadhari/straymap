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
} from './slice';
import { setMapEvent } from '../gnss/slice';
import { startAppListening } from '../../store/listenerMiddleware';
import { selectInitialized } from './selectors';
import { AppStore } from '../../store/store';
import { logError } from '../../lib/utils';
import { haversineDistance } from '../../lib/formatting';
import { appendPointToLine } from './db/actionsTrack';
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
 * Listener 2: GNSS filtering pipeline.
 * Watches setMapEvent from the gnss slice and writes qualifying points to DB.
 * Updates lastWrittenPosition/lastWrittenTime BEFORE the async DB write to
 * prevent race conditions when concurrent events arrive.
 */
startAppListening({
	actionCreator: setMapEvent,
	effect: async (action, listenerApi) => {
		const state = listenerApi.getState();
		const trk = state.trackRecording;

		if (!trk.isRecording) {
			return;
		}

		const { center } = action.payload;
		const { minDistance, minTime, lastWrittenPosition, lastWrittenTime, activeLineId } = trk;

		if (!activeLineId || !center || center.length < 2) {
			return;
		}

		if (!dbConnection?.drizzle) {
			return;
		}

		const lng = center[0];
		const lat = center[1];
		const now = Date.now();

		// Guard: time
		if (lastWrittenTime && now - lastWrittenTime < minTime * 1000) {
			return;
		}

		// Guard: distance
		if (lastWrittenPosition && minDistance > 0) {
			const dist = haversineDistance(lastWrittenPosition, [lng, lat]);
			if (dist < minDistance) {
				return;
			}
		}

		// Update state BEFORE the await so concurrent invocations see the
		// updated position and time, preventing duplicate writes.
		listenerApi.dispatch(setLastWrittenPosition([lng, lat]));
		listenerApi.dispatch(setLastWrittenTime(now));

		// Write to DB (altitude intentionally omitted — MapEventResponse.center
		// only carries [lng, lat]; elevation lookups use getAltitudeAtPosition).
		try {
			await appendPointToLine(activeLineId, [lng, lat]);
		} catch (err) {
			logError('trackRecording/appendPoint', err);
		}
	},
});
