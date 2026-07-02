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
	GeneralSettings,
	GeneralState,
	initialSettings,
	setHardwareKeys,
	setInitialized,
	setMapUpdateInterval,
	setUnitPrefs,
} from './slice';
import { startAppListening } from '../../listenerMiddleware';
import { selectInitialized } from './selectors';
import { AppStore } from '../../store';
import { logError } from '../../../lib/utils';

const settingsKey = 'generalSettings';

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
				const newSettings = JSON.parse(newSettingsStr) as Partial<GeneralState>;
				if (newSettings?.hardwareKeys) {
					store.dispatch(setHardwareKeys(newSettings.hardwareKeys));
				}
				if (newSettings?.unitPrefs) {
					store.dispatch(setUnitPrefs(newSettings.unitPrefs));
				}
				if (newSettings?.mapUpdateInterval) {
					store.dispatch(setMapUpdateInterval(newSettings.mapUpdateInterval));
				}
			}
			store.dispatch(setInitialized(true));
		})
		.catch((err) => logError('general/connectStorage', err));
};

/**
 * Compares settings in this store slice with initialSettings,
 * and saves anything that differs to initialSettings to defaultPreferences.
 */
export const saveToStorage = (generalState: GeneralState, actionType: string) => {
	if (!generalState.initialized) {
		return;
	}
	const settingsToSave: Partial<GeneralSettings> = {};
	Object.keys(initialSettings).forEach((key) => {
		let shouldSave = false;
		let valueToSave;
		switch (key) {
			default:
				valueToSave = get(generalState, key);
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
	matcher: isAnyOf(setHardwareKeys, setUnitPrefs, setMapUpdateInterval),
	effect: async (action, listenerApi) => {
		try {
			await saveToStorage(listenerApi.getState().general, action.type);
		} catch (err) {
			logError('saveToStorage', err);
		}
	},
});
