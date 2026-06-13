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
	RoutingSettings,
	RoutingState,
	initialSettings,
	processRouting,
	setInitialized,
	setIsRouting,
	setPointsAction,
} from './slice';
import { startAppListening } from '../../listenerMiddleware';
import { selectInitialized } from './selectors';
import { AppStore } from '../../store';

const settingsKey = 'routingSettings';

/**
 * Loads settings from defaultPreferences and dispatches them to the store.
 */
export const initializeFromStorage = (store: AppStore) => {
	if (selectInitialized(store.getState())) {
		return;
	}
	DefaultPreference.get(settingsKey)
		.then(async (newSettingsStr) => {
			if (newSettingsStr) {
				const newSettings = JSON.parse(newSettingsStr) as Partial<RoutingState>;
				if (newSettings?.isRouting) {
					store.dispatch(setIsRouting(newSettings.isRouting));
					const routes = await fetchRoutes({
						routeId: newSettings.isRouting,
					});
					if (routes.length) {
						store.dispatch(
							setPointsAction({ points: routes[0].points, updateLine: false })
						);
					}
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
export const saveToStorage = (routingState: RoutingState, actionType: string) => {
	if (!routingState.initialized) {
		return;
	}
	const settingsToSave: Partial<RoutingSettings> = {};
	Object.keys(initialSettings).forEach((key) => {
		let shouldSave = false;
		let valueToSave;
		switch (key) {
			default:
				valueToSave = get(routingState, key);
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
	matcher: isAnyOf(setIsRouting),
	effect: async (action, listenerApi) => {
		saveToStorage(listenerApi.getState().routing, action.type);
	},
});

startAppListening({
	actionCreator: setPointsAction,
	effect: async (action, listenerApi) => {
		listenerApi.dispatch(
			processRouting({
				updateLine: action.payload.updateLine,
			})
		);
	},
});
