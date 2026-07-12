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
	UpdaterSettings,
	UpdaterState,
	initialSettings,
	setInitialized,
	setInstalledVersion,
} from './slice';
import packageJson from '../../../package.json';
import { startAppListening } from '../../store/listenerMiddleware';
import { selectInitialized } from './selectors';
import Updater from './Updater';
import { AppStore } from '../../store/store';
import { logError } from '../../lib/utils';

const settingsKey = 'updaterSettings';

/**
 * Loads settings from defaultPreferences and dispatches them to the store.
 */
export const initializeFromStorage = (store: AppStore) => {
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
			.catch((err) => logError('updater/connectStorage', err));
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
	return DefaultPreference.set(settingsKey, JSON.stringify(settingsToSave));
};

/**
 * Listens to action that change settings in this store slice,
 * and calls the function to save them to defaultPreferences.
 */
startAppListening({
	matcher: isAnyOf(setInstalledVersion),
	effect: async (action, listenerApi) => {
		try {
			await saveToStorage(listenerApi.getState().updater, action.type);
		} catch (err) {
			logError('saveToStorage', err);
		}
	},
});
