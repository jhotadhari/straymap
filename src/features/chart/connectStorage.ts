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
	ChartState,
	setInitialized,
	setChartSettings,
	removeChartSettings,
	setGeneralSettings,
} from './slice';
import { DEFAULT_CHART_SETTINGS } from './types';
import { startAppListening } from '../../store/listenerMiddleware';
import { selectInitialized } from './selectors';
import { AppStore } from '../../store/store';
import { logError } from '../../lib/utils';

const settingsKey = 'chartSettings';

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
				const newSettings = JSON.parse(newSettingsStr) as Partial<ChartState>;
				if (newSettings?.charts) {
					Object.entries(newSettings.charts).forEach(([key, settings]) => {
						store.dispatch(setChartSettings({ key, settings }));
					});
				}
				if (newSettings?.general) {
					store.dispatch(setGeneralSettings(newSettings.general));
				}
			}
			store.dispatch(setInitialized(true));
		})
		.catch((err) => logError('chart/connectStorage', err));
};

/**
 * Compares settings in this store slice with the initial state,
 * and saves anything that differs to defaultPreferences.
 */
export const saveToStorage = (state: ChartState, actionType: string) => {
	if (!state.initialized) {
		return;
	}
	const settingsToSave: Partial<ChartState> = {};
	Object.keys(state).forEach((key) => {
		let shouldSave = false;
		let valueToSave;
		switch (key) {
			case 'charts':
				valueToSave = state.charts;
				shouldSave = !isEqual(valueToSave, {});
				break;
			case 'general':
				valueToSave = state.general;
				shouldSave = !isEqual(valueToSave, DEFAULT_CHART_SETTINGS);
				break;
			default:
				valueToSave = get(state, key);
				shouldSave = !isEqual(valueToSave, get({ initialized: false, charts: {} }, key));
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
 * Listens to actions that change settings in this store slice,
 * and calls the function to save them to defaultPreferences.
 */
startAppListening({
	matcher: isAnyOf(setChartSettings, removeChartSettings, setGeneralSettings),
	effect: async (action, listenerApi) => {
		try {
			await saveToStorage(listenerApi.getState().chart, action.type);
		} catch (err) {
			logError('saveToStorage', err);
		}
	},
});
