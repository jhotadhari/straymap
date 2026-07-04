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
} from './slice';
import { setMapEvent } from '../gnss/slice';
import { startAppListening } from '../../listenerMiddleware';
import { selectInitialized } from './selectors';
import { AppStore } from '../../store';
import { logError } from '../../../lib/utils';
import { appendPointToLine } from './db/actionsTrack';

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
				const newSettings = JSON.parse(
					newSettingsStr
				) as Partial<TrackRecordingState>;
				if (typeof newSettings.isRecording === 'boolean') {
					store.dispatch(setIsRecordingAction(newSettings.isRecording));
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
			}
			store.dispatch(setInitialized(true));
		})
		.catch((err) => logError('trackRecording/connectStorage', err));
};

/**
 * Persist settings that differ from initialSettings to DefaultPreference.
 */
export const saveToStorage = (
	state: TrackRecordingState,
	actionType: string
) => {
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
		setMinPrecision
	),
	effect: async (action, listenerApi) => {
		try {
			await saveToStorage(
				listenerApi.getState().trackRecording,
				action.type
			);
		} catch (err) {
			logError('saveToStorage', err);
		}
	},
});

/**
 * Haversine distance between two [lng, lat] points, returns meters.
 */
const haversineDistance = (
	a: [number, number],
	b: [number, number]
): number => {
	const R = 6371000; // Earth radius in meters
	const toRad = (deg: number) => (deg * Math.PI) / 180;
	const dLat = toRad(b[1] - a[1]);
	const dLng = toRad(b[0] - a[0]);
	const sinDLat = Math.sin(dLat / 2);
	const sinDLng = Math.sin(dLng / 2);
	const aVal =
		sinDLat * sinDLat +
		Math.cos(toRad(a[1])) *
			Math.cos(toRad(b[1])) *
			sinDLng *
			sinDLng;
	return R * 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
};

/**
 * Listener 2: GPS filtering pipeline.
 * Watches setMapEvent from the gps slice and writes qualifying points to DB.
 */
startAppListening({
	actionCreator: setMapEvent,
	effect: async (action, listenerApi) => {
		const state = listenerApi.getState();
		const trk = state.trackRecording;

		if (!trk.isRecording) {
			return;
		}

		const { center, accuracy } = action.payload;
		const { minPrecision, minDistance, minTime, lastWrittenPosition, lastWrittenTime, activeLineId } = trk;

		if (!activeLineId || !center || center.length < 2) {
			return;
		}

		const lng = center[0];
		const lat = center[1];
		const now = Date.now();

		// Guard: accuracy
		if (accuracy !== undefined && accuracy > minPrecision) {
			return;
		}

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

		// Pass — write immediately
		try {
			await appendPointToLine(activeLineId, [lng, lat, center[2]]);
			listenerApi.dispatch(setLastWrittenPosition([lng, lat]));
			listenerApi.dispatch(setLastWrittenTime(now));
		} catch (err) {
			logError('trackRecording/appendPoint', err);
		}
	},
});
