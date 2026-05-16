/**
 * External dependencies
 */
import { isAnyOf, type EnhancedStore } from '@reduxjs/toolkit';
import DefaultPreference from 'react-native-default-preference';
import { get, isEqual, omit, pick, set } from 'lodash-es';
import rnUuid from 'react-native-uuid';

/**
 * Internal dependencies
 */
import {
	addItem,
	setDashboardStyle,
	DashboardSettings,
	DashboardState,
	initialSettings,
	removeItemKey,
	setInitialized,
	setItems,
	setElementsSettings,
} from './dashboardSlice';
import { startAppListening } from '../../listenerMiddleware';
import * as elements from './elements';
import { DashboardElement, DashboardElementSetting } from './types';

const settingsKey = 'dashboardSettings';

/**
 * Loads settings from defaultPreferences and dispatches them to the store.
 *
 * Has to be called in index.js after the store got initialized.
 */
export const initializeFromStorage = (store: EnhancedStore) => {
	Promise.all([
		new Promise((resolve: (value: boolean) => void) => {
			DefaultPreference.get(settingsKey)
				.then((newSettingsStr) => {
					if (newSettingsStr) {
						const newSettings = JSON.parse(newSettingsStr) as Partial<DashboardState>;
						if (newSettings?.itemsTop) {
							store.dispatch(
								setItems({
									position: 'top',
									items: newSettings.itemsTop,
								})
							);
						}
						if (newSettings?.itemsBottom) {
							store.dispatch(
								setItems({
									position: 'bottom',
									items: newSettings.itemsBottom,
								})
							);
						}
						if (newSettings?.dashboardStyle) {
							store.dispatch(setDashboardStyle(newSettings.dashboardStyle));
						}
					}
					resolve(true);
				})
				.catch((err: any) => {
					console.log('ERROR', err);
					resolve(false);
				});
		}),
		new Promise((resolve: (value: boolean) => void) => {
			const elementsSettings: { [key: string]: DashboardElementSetting } = {};
			Object.keys(elements as { [key: string]: DashboardElement }).forEach((key) => {
				elementsSettings[key] = omit(get(elements, key) as DashboardElement, [
					'Display',
					'Control',
					'Icon',
				]);
			});
			store.dispatch(setElementsSettings(elementsSettings));
			resolve(true);
		}),
	])
		.then((results: boolean[]) => {
			if (results.every((result) => !!result)) {
				store.dispatch(setInitialized(true));
			}
		})
		.catch((err: any) => console.log(err));
};

/**
 * Compares settings in this store slice with initialSettings,
 * and saves anything that differs to initialSettings to defaultPreferences.
 */
export const saveToStorage = (dashboardState: DashboardState, actionType: string) => {
	if (!dashboardState.initialized) {
		return;
	}
	const settingsToSave: Partial<DashboardSettings> = {};
	Object.keys(initialSettings).forEach((key) => {
		let shouldSave = false;
		let valueToSave;
		switch (key) {
			default:
				valueToSave = get(dashboardState, key);
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
	matcher: isAnyOf(setDashboardStyle, setItems, addItem, removeItemKey),
	effect: async (action, listenerApi) => {
		saveToStorage(listenerApi.getState().dashboard, action.type);
	},
});
