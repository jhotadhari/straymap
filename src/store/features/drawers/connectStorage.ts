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
	DrawersSettings,
	DrawersState,
	initialSettings,
	setInitialized,
	setItemKeys,
	removeItemKey,
	addItemKey,
} from './drawersSlice';
import { startAppListening } from '../../listenerMiddleware';

const settingsKey = 'drawersSettings';

/**
 * Loads settings from defaultPreferences and dispatches them to the store.
 *
 * Has to be called in index.js after the store got initialized.
 */
export const initializeFromStorage = (store: EnhancedStore) => {
	DefaultPreference.get(settingsKey)
		.then((newSettingsStr) => {
			if (newSettingsStr) {
				const newSettings = JSON.parse(newSettingsStr) as Partial<DrawersState>;
				if (newSettings?.itemKeysLeft) {
					store.dispatch(
						setItemKeys({
							side: 'left',
							itemKeys: newSettings.itemKeysLeft,
						})
					);
				}
				if (newSettings?.itemKeysRight) {
					store.dispatch(
						setItemKeys({
							side: 'right',
							itemKeys: newSettings.itemKeysRight,
						})
					);
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
export const saveToStorage = (drawersState: DrawersState, actionType: string) => {
	if (!drawersState.initialized) {
		return;
	}
	const settingsToSave: Partial<DrawersSettings> = {};
	Object.keys(initialSettings).forEach((key) => {
		let shouldSave = false;
		let valueToSave;
		switch (key) {
			default:
				valueToSave = get(drawersState, key);
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
	matcher:
		isAnyOf(
			setItemKeys,
			addItemKey,
			removeItemKey,
		),
	effect: async (action, listenerApi) => {
		saveToStorage(listenerApi.getState().drawers, action.type);
	},
});
