/**
 * External dependencies
 */
import { isAnyOf } from '@reduxjs/toolkit';
import DefaultPreference from 'react-native-default-preference';
import { get, isEqual, omit, set } from 'lodash-es';

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
} from './slice';
import { startAppListening } from '../../listenerMiddleware';
import { logError } from '../../../lib/utils';
import { DashboardWidget, DashboardWidgetSetting } from './types';
import { selectInitialized } from './selectors';
import { featureRegistry } from '../FeatureRegistry';
import { AppStore } from '../../store';

const settingsKey = 'dashboardSettings';

/**
 * Loads settings from defaultPreferences and dispatches them to the store.
 */
export const initializeFromStorage = (store: AppStore) => {
	if (selectInitialized(store.getState())) {
		return;
	}
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
						if (newSettings?.dashboardStyleTop) {
							store.dispatch(
								setDashboardStyle({
									position: 'top',
									style: {
										...initialSettings.dashboardStyleTop,
										...newSettings.dashboardStyleTop,
									},
								})
							);
						}
						if (newSettings?.dashboardStyleBottom) {
							store.dispatch(
								setDashboardStyle({
									position: 'bottom',
									style: {
										...initialSettings.dashboardStyleBottom,
										...newSettings.dashboardStyleBottom,
									},
								})
							);
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
			const elementsSettings: { [key: string]: DashboardWidgetSetting } = {};
			Object.keys(featureRegistry.getDashboardWidgets()).forEach((key) => {
				elementsSettings[key] = omit(
					featureRegistry.getDashboardWidgets()[key] as DashboardWidget,
					[
						'Display',
						'Control',
						'Icon',
					]
				);
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
	return DefaultPreference.set(settingsKey, JSON.stringify(settingsToSave));
};

/**
 * Listens to action that change settings in this store slice,
 * and calls the function to save them to defaultPreferences.
 */
startAppListening({
	matcher: isAnyOf(setDashboardStyle, setItems, addItem, removeItemKey),
	effect: async (action, listenerApi) => {
		try {
			await saveToStorage(listenerApi.getState().dashboard, action.type);
		} catch (err) {
			logError('saveToStorage', err);
		}
	},
});
