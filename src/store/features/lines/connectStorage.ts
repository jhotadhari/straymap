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
	LinesSettings,
	LinesState,
<<<<<<< Updated upstream
	initialSettings,
	setInitialized,
	setSelected,
=======
	cleanupFilters,
	initialSettings,
	setFilters,
	setFilterLogic,
	setInitialized,
	setSelected,
	setSort,
>>>>>>> Stashed changes
	setTableColumns,
} from './slice';
import { startAppListening } from '../../listenerMiddleware';
import { selectInitialized } from './selectors';
import { AppStore } from '../../store';
import { logError } from '../../../lib/utils';

const settingsKey = 'linesSettings';

/**
 * Loads settings from defaultPreferences and dispatches them to the store.
 */
export const initializeFromStorage = (store: AppStore) => {
	if (selectInitialized(store.getState())) {
		return;
	}
	DefaultPreference.get(settingsKey)
		.then((newSettingsStr) => {
			if (newSettingsStr) {
				const newSettings = JSON.parse(newSettingsStr) as Partial<LinesState>;
				if (newSettings?.selected) {
					store.dispatch(setSelected(newSettings.selected));
				}
				if (newSettings?.tableColumns) {
					store.dispatch(setTableColumns(newSettings.tableColumns));
				}
<<<<<<< Updated upstream
=======
				if (newSettings?.sort !== undefined) {
					store.dispatch(setSort(newSettings.sort));
				}
				if (newSettings?.filters) {
					store.dispatch(setFilters(newSettings.filters));
				}
				if (newSettings?.filterLogic) {
					store.dispatch(setFilterLogic(newSettings.filterLogic));
				}
>>>>>>> Stashed changes
			}
			store.dispatch(setInitialized(true));
		})
		.catch((err) => logError('lines/connectStorage', err));
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
	return DefaultPreference.set(settingsKey, JSON.stringify(settingsToSave));
};

/**
 * Listens to action that change settings in this store slice,
 * and calls the function to save them to defaultPreferences.
 */
startAppListening({
<<<<<<< Updated upstream
	matcher: isAnyOf(setSelected, setTableColumns),
=======
	matcher: isAnyOf(setSelected, setTableColumns, setSort, setFilters, setFilterLogic),
>>>>>>> Stashed changes
	effect: async (action, listenerApi) => {
		try {
			await saveToStorage(listenerApi.getState().lines, action.type);
		} catch (err) {
			logError('saveToStorage', err);
		}
<<<<<<< Updated upstream
=======
	},
});

/**
 * When tableColumns change, clean up filters for columns that are no longer visible.
 */
startAppListening({
	matcher: isAnyOf(setTableColumns),
	effect: async (_action, listenerApi) => {
		listenerApi.dispatch(cleanupFilters());
>>>>>>> Stashed changes
	},
});
