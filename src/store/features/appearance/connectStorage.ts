/**
 * External dependencies
 */
import { isAnyOf, type EnhancedStore } from '@reduxjs/toolkit';
import DefaultPreference from 'react-native-default-preference';
import { get, isEqual, set } from 'lodash-es';

/**
 * Internal dependencies
 */
import {
	AppearanceSettings,
	AppearanceState,
	initialSettings,
	setCursorAction,
	setInitialized,
	setTheme,
} from './slice';
import { startAppListening } from '../../listenerMiddleware';
import customThemes from '../../../themes';
import { selectInitialized } from './selectors';

const settingsKey = 'appearanceSettings';

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
				const newSettings = JSON.parse(newSettingsStr) as Partial<AppearanceState>;
				if (
					newSettings?.theme &&
					('system' === newSettings.theme ||
						Object.keys(customThemes).includes(newSettings.theme))
				) {
					store.dispatch(setTheme(newSettings.theme));
				}
				if (newSettings?.cursor) {
					store.dispatch(setCursorAction(newSettings.cursor));
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
export const saveToStorage = (appearanceState: AppearanceState, actionType: string) => {
	if (!appearanceState.initialized) {
		return;
	}
	const settingsToSave: Partial<AppearanceSettings> = {};
	Object.keys(initialSettings).forEach((key) => {
		if (!isEqual(get(appearanceState, key), get(initialSettings, key))) {
			set(settingsToSave, key, get(appearanceState, key));
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
	matcher: isAnyOf(setTheme, setCursorAction),
	effect: async (action, listenerApi) => {
		saveToStorage(listenerApi.getState().appearance, action.type);
	},
});
