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
	UiSettings,
	UiState,
	initialSettings,
	setElementExpanded,
	setExpandedElements,
	setInitialized,
} from './slice';
import { startAppListening } from '../../listenerMiddleware';
import { selectInitialized } from './selectors';
import { AppStore } from '../../store';

const settingsKey = 'uiSettings';

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
				const newSettings = JSON.parse(newSettingsStr) as Partial<UiState>;
				if (newSettings?.expandedElements) {
					store.dispatch(setExpandedElements(newSettings.expandedElements));
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
export const saveToStorage = (uiState: UiState, actionType: string) => {
	if (!uiState.initialized) {
		return;
	}
	const settingsToSave: Partial<UiSettings> = {};
	Object.keys(initialSettings).forEach((key) => {
		if (!isEqual(get(uiState, key), get(initialSettings, key))) {
			set(settingsToSave, key, get(uiState, key));
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
	matcher: isAnyOf(setExpandedElements, setElementExpanded),
	effect: async (action, listenerApi) => {
		saveToStorage(listenerApi.getState().ui, action.type);
	},
});
