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
	setControlHandleSide,
} from './slice';
import { startAppListening } from '../../listenerMiddleware';
import { selectInitialized } from './selectors';

const settingsKey = 'drawersSettings';

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
				if (newSettings?.controlHandleSide) {
					store.dispatch(setControlHandleSide(newSettings.controlHandleSide));
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
	matcher: isAnyOf(setControlHandleSide, setItemKeys, addItemKey, removeItemKey),
	effect: async (action, listenerApi) => {
		saveToStorage(listenerApi.getState().drawers, action.type);
	},
});
