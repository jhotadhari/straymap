/**
 * External dependencies
 */
import { isAnyOf } from '@reduxjs/toolkit';
import DefaultPreference from 'react-native-default-preference';
import { get, isEqual, set } from 'lodash-es';
import { sprintf } from 'sprintf-js';
import { ANDROID_DATABASE_PATH } from '@op-engineering/op-sqlite';

/**
 * Internal dependencies
 */
import {
	DbLoaderSettings,
	DbLoaderState,
	initialSettings,
	setDbMigrated,
	setDbPathAction,
	setInitialized,
} from './slice';
import { startAppListening } from '../../store/listenerMiddleware';
import { selectInitialized } from './selectors';
import { AppStore } from '../../store/store';
import { dbConnection } from './DBConnection';
import { logError } from '../../lib/utils';
import { getDbDefaultName } from './utils';
import { dbExtension } from './constants';
import i18n from '../../assets/i18n/i18n';

const settingsKey = 'dbLoaderSettings';

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
				let dbPath = initialSettings.dbPath;
				if (newSettingsStr) {
					const newSettings = JSON.parse(newSettingsStr) as Partial<DbLoaderState>;
					if (newSettings?.dbPath) {
						dbPath = newSettings?.dbPath;
						store.dispatch(setDbPathAction(newSettings.dbPath));
					}
				}
				dbConnection
					.initialize(dbPath)
					.then(() => {
						store.dispatch(setDbMigrated(true));
						store.dispatch(setInitialized(true));
						resolve(true);
					})
					.catch((error) => {
						const fallbackDbName = [
							getDbDefaultName(),
							dbExtension,
						].join('.');
						const fallbackPath = ANDROID_DATABASE_PATH + fallbackDbName;

						store.dispatch(setDbPathAction(fallbackPath));

						const message = [
							'string' === error?.message ? error.message : 'Error',
							sprintf(
								i18n.t('dbLoader.dbMigrationFallbackCreated'),
								dbPath,
								fallbackDbName
							),
						].join('\n\n');

						store.dispatch(setDbMigrated(message));
					});
			})
			.catch((err) => logError('dbLoader/connectStorage', err));
	});
};

/**
 * Compares settings in this store slice with initialSettings,
 * and saves anything that differs to initialSettings to defaultPreferences.
 */
export const saveToStorage = (dbLoaderState: DbLoaderState, actionType: string) => {
	if (!dbLoaderState.initialized) {
		return;
	}
	const settingsToSave: Partial<DbLoaderSettings> = {};
	Object.keys(initialSettings).forEach((key) => {
		let shouldSave = false;
		let valueToSave;
		switch (key) {
			default:
				valueToSave = get(dbLoaderState, key);
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
	matcher: isAnyOf(setDbPathAction),
	effect: async (action, listenerApi) => {
		try {
			await saveToStorage(listenerApi.getState().dbLoader, action.type);
		} catch (err) {
			logError('saveToStorage', err);
		}
	},
});
