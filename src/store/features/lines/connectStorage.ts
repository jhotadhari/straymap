/**
 * External dependencies
 */
import { isAnyOf, type EnhancedStore } from '@reduxjs/toolkit';
import DefaultPreference from 'react-native-default-preference';
import { get, isEqual, omit, set } from 'lodash-es';
import { LineString } from 'geojson';

/**
 * Internal dependencies
 */
import {
	LinesSettings,
	LinesState,
	initialSettings,
	setInitialized,
	setLines,
	setSelectedIds,
} from './linesSlice';
import { startAppListening } from '../../listenerMiddleware';
import { selectInitialized } from './selectors';
import { getLinesWithTags } from './db/selectors';
import { parseSerialized } from '../../../lib/utilsGeneral';

const settingsKey = 'linesSettings';





export const updateStoreLinesFromDb = async (lineIds: number[], dispatch: EnhancedStore['dispatch'] ) => {
	const lines = await getLinesWithTags({
		lineIds,
		allLines: true,
	});
	const newLinesFromDb = lines.map((line) => {
		return {
			...omit(line, 'geometryGeoJSON'),
			geometry: parseSerialized<LineString>(line.geometryGeoJSON)!,
		};
	});
	dispatch(setLines(newLinesFromDb));
};






/**
 * Loads settings from defaultPreferences and dispatches them to the store.
 */
export const initializeFromStorage = (store: EnhancedStore) => {
	if (selectInitialized(store.getState())) {
		return;
	}
	DefaultPreference.get(settingsKey)
		.then((newSettingsStr) => {
			if (newSettingsStr) {
				const newSettings = JSON.parse(newSettingsStr) as Partial<LinesState>;
				if (newSettings?.selectedIds) {
					store.dispatch(setSelectedIds(newSettings.selectedIds));
				}
			}
			store.dispatch(setInitialized(true));

		})
		.catch((err) => 'ERROR' + console.log(err));
};

/**
 * Compares settings in this store slice with initialSettings,
 * and saves anything that differs to initialSettings to defaultPreferences.
 */
export const saveToStorage = (linesState: LinesState, actionType: string) => {
	if (!linesState.initialized) {
		return;
	}
	const settingsToSave: Partial<LinesSettings> = {};
	Object.keys(initialSettings).forEach((key) => {
		let shouldSave = false;
		let valueToSave;
		switch (key) {
			default:
				valueToSave = get(linesState, key);
				shouldSave = !isEqual(valueToSave, get(initialSettings, key));
		}
		if (shouldSave) {
			set(settingsToSave, key, valueToSave);
		}
	});
	if (__DEV__ && globalThis.shouldLog.saveToStorage) {
		console.log('DEBUG saveToStorage', settingsKey, actionType, settingsToSave);
	}
	DefaultPreference.set(settingsKey, JSON.stringify(settingsToSave));
};

/**
 * Listens to action that change settings in this store slice,
 * and calls the function to save them to defaultPreferences.
 */
startAppListening({
	matcher: isAnyOf(
		setSelectedIds,
	),
	effect: async (action, listenerApi) => {
		saveToStorage(listenerApi.getState().lines, action.type);
	},
});




startAppListening({
	actionCreator: setSelectedIds,
	effect: async (action, listenerApi) => {
		updateStoreLinesFromDb( action.payload, listenerApi.dispatch )
	},
});