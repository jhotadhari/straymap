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
	UpdaterSettings,
	UpdaterState,
	initialSettings,
	setInitialized,
	setInstalledVersion,
} from './updaterSlice';
import packageJson from '../../../../package.json';
import { startAppListening } from '../../listenerMiddleware';
import { selectInitialized } from './selectors';
import Updater from './Updater';

const settingsKey = 'updaterSettings';

/**
 * Loads settings from defaultPreferences and dispatches them to the store.
 *
 * Has to be called in index.js after the store got initialized.
 */
export const initializeFromStorage = (store: EnhancedStore) => {
	return new Promise<boolean>((resolve) => {
		if (selectInitialized(store.getState())) {
			resolve(false);
			return;
		}
		DefaultPreference.get(settingsKey)
			.then((newSettingsStr) => {
				const newSettings = (
					newSettingsStr ? JSON.parse(newSettingsStr) : {}
				) as Partial<UpdaterState>;
				const version = newSettings?.installedVersion ?? packageJson.version;
				store.dispatch(setInstalledVersion(version));
				new Updater(store).run(version).then(() => {
					//
					//
					// If there were other settings for this slice to load from DefaultPreference into store, it should be done here.
					//
					//
					store.dispatch(setInitialized(true));
					resolve(true);
				});
			})
			.catch((err) => 'ERROR' + console.log(err));
	});
};

/**
 * Compares settings in this store slice with initialSettings,
 * and saves anything that differs to initialSettings to defaultPreferences.
 */
export const saveToStorage = (updaterState: UpdaterState, actionType: string) => {
	//
	//
	// If there were other settings for this slice to save then the following had to be splitted somehow and wait for initialized
	//
	//
	// if (!updaterState.initialized) {
	// 	return;
	// }

	const settingsToSave: Partial<UpdaterSettings> = {};
	Object.keys(initialSettings).forEach((key) => {
		let shouldSave = false;
		let valueToSave;
		switch (key) {
			default:
				valueToSave = get(updaterState, key);
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
	matcher: isAnyOf(setInstalledVersion),
	effect: async (action, listenerApi) => {
		saveToStorage(listenerApi.getState().updater, action.type);
	},
});
