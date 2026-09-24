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
	BottomDrawerSettings,
	BottomDrawersState,
	initialSettings,
	setInitialized,
	setItemKeys,
	removeItemKey,
	addItemKey,
	setActiveKey,
} from './slice';
import { startAppListening } from '../../store/listenerMiddleware';
import { selectInitialized } from './selectors';
import { AppStore } from '../../store/store';
import { logError } from '../../lib/utils';

const settingsKey = 'bottomDrawerSettings';

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
				const newSettings = JSON.parse(newSettingsStr) as Partial<BottomDrawersState>;
				if (newSettings?.itemKeys) {
					store.dispatch(setItemKeys(newSettings.itemKeys));
				}
				if (newSettings?.activeKey) {
					store.dispatch(setActiveKey(newSettings.activeKey));
				}
			}
			store.dispatch(setInitialized(true));
		})
		.catch((err) => logError('bottomDrawer/connectStorage', err));
};

/**
 * Compares settings in this store slice with initialSettings,
 * and saves anything that differs to initialSettings to defaultPreferences.
 */
export const saveToStorage = (bottomDrawerState: BottomDrawersState, actionType: string) => {
	if (!bottomDrawerState.initialized) {
		return;
	}
	const settingsToSave: Partial<BottomDrawerSettings> = {};
	Object.keys(initialSettings).forEach((key) => {
		let shouldSave = false;
		let valueToSave;
		switch (key) {
			default:
				valueToSave = get(bottomDrawerState, key);
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
 * Listens to actions that change settings in this store slice,
 * and calls the function to save them to defaultPreferences.
 */
startAppListening({
	matcher: isAnyOf(setItemKeys, addItemKey, removeItemKey, setActiveKey),
	effect: async (action, listenerApi) => {
		try {
			await saveToStorage(listenerApi.getState().bottomDrawer, action.type);
		} catch (err) {
			logError('saveToStorage', err);
		}
	},
});
