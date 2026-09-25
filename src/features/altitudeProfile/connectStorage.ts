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
	AltitudeProfileState,
	setInitialized,
	setProfileSettings,
	removeProfileSettings,
} from './slice';
import { startAppListening } from '../../store/listenerMiddleware';
import { selectInitialized } from './selectors';
import { AppStore } from '../../store/store';
import { logError } from '../../lib/utils';

const settingsKey = 'altitudeProfileSettings';

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
				const newSettings = JSON.parse(newSettingsStr) as Partial<AltitudeProfileState>;
				if (newSettings?.profiles) {
					Object.entries(newSettings.profiles).forEach(([key, settings]) => {
						store.dispatch(setProfileSettings({ key, settings }));
					});
				}
			}
			store.dispatch(setInitialized(true));
		})
		.catch((err) => logError('altitudeProfile/connectStorage', err));
};

/**
 * Compares settings in this store slice with the initial state,
 * and saves anything that differs to defaultPreferences.
 */
export const saveToStorage = (state: AltitudeProfileState, actionType: string) => {
	if (!state.initialized) {
		return;
	}
	const settingsToSave: Partial<AltitudeProfileState> = {};
	Object.keys(state).forEach((key) => {
		let shouldSave = false;
		let valueToSave;
		switch (key) {
			case 'profiles':
				valueToSave = state.profiles;
				shouldSave = !isEqual(valueToSave, {});
				break;
			default:
				valueToSave = get(state, key);
				shouldSave = !isEqual(valueToSave, get({ initialized: false, profiles: {} }, key));
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
	matcher: isAnyOf(setProfileSettings, removeProfileSettings),
	effect: async (action, listenerApi) => {
		try {
			await saveToStorage(listenerApi.getState().altitudeProfile, action.type);
		} catch (err) {
			logError('saveToStorage', err);
		}
	},
});
