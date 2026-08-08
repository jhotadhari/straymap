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
	DrawersSettings,
	DrawersState,
	initialSettings,
	setInitialized,
	setItemKeys,
	removeItemKey,
	addItemKey,
	setControlHandleSide,
	setActiveKey,
	setSortable,
	setShowSettingsHandle,
} from './slice';
import { startAppListening } from '../../store/listenerMiddleware';
import { selectInitialized } from './selectors';
import { AppStore } from '../../store/store';
import { logError } from '../../lib/utils';

const settingsKey = 'drawersSettings';

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
				if (newSettings?.activeKeyLeft) {
					store.dispatch(
						setActiveKey({
							side: 'left',
							activeKey: newSettings.activeKeyLeft,
						})
					);
				}
				if (newSettings?.activeKeyRight) {
					store.dispatch(
						setActiveKey({
							side: 'right',
							activeKey: newSettings.activeKeyRight,
						})
					);
				}
				if (newSettings?.controlHandleSide) {
					store.dispatch(setControlHandleSide(newSettings.controlHandleSide));
				}
				if (undefined !== newSettings?.showSettingsHandle) {
					store.dispatch(setShowSettingsHandle(newSettings.showSettingsHandle));
				}
				if (undefined !== newSettings?.sortable) {
					store.dispatch(setSortable(newSettings.sortable));
				}
			}
			store.dispatch(setInitialized(true));
		})
		.catch((err) => logError('drawers/connectStorage', err));
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
	return DefaultPreference.set(settingsKey, JSON.stringify(settingsToSave));
};

/**
 * Listens to action that change settings in this store slice,
 * and calls the function to save them to defaultPreferences.
 */
startAppListening({
	matcher: isAnyOf(
		setControlHandleSide,
		setItemKeys,
		addItemKey,
		removeItemKey,
		setActiveKey,
		setShowSettingsHandle,
		setSortable
	),
	effect: async (action, listenerApi) => {
		try {
			await saveToStorage(listenerApi.getState().drawers, action.type);
		} catch (err) {
			logError('saveToStorage', err);
		}
	},
});
