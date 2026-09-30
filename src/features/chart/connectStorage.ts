/**
 * External dependencies
 */
import { isAnyOf } from '@reduxjs/toolkit';
import DefaultPreference from 'react-native-default-preference';
import { isEqual } from 'lodash-es';

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
		})
		.catch((err) => logError('chart/connectStorage', err))
		.finally(() => {
			// Always complete init — a failed storage read or corrupt
			// JSON must degrade to defaults, not hang app startup.
			store.dispatch(setInitialized(true));
		});
};

/**
 * Compares settings in this store slice with the initial state,
 * and saves anything that differs to defaultPreferences.
 */
export const saveToStorage = (state: ChartState, actionType: string) => {
	if (!state.initialized) {
		return;
	}
	// Persist only the two settings containers — initialized and
	// fullscreenLineId are ephemeral and must not accumulate in storage.
	const settingsToSave: Partial<ChartState> = {};
	if (!isEqual(state.charts, {})) {
		settingsToSave.charts = state.charts;
	}
	if (!isEqual(state.general, DEFAULT_CHART_SETTINGS)) {
		settingsToSave.general = state.general;
	}
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
