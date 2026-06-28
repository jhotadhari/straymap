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
	setIsRoutingAction,
	setRoutingLineId,
} from './slice';
import { startAppListening } from '../../listenerMiddleware';
import { selectInitialized } from './selectors';
import { AppStore } from '../../store';
import { dbConnection } from '../dbLoader/DBConnection';
import { logError } from '../../../lib/utils';

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
					store.dispatch(setIsRoutingAction(newSettings.isRouting));
				}
				if (newSettings?.routingLineId) {
					store.dispatch(setRoutingLineId(newSettings.routingLineId));
				}
			}
			store.dispatch(setInitialized(true));
		})
		.catch((err) => logError('routing/connectStorage', err));
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
	return DefaultPreference.set(settingsKey, JSON.stringify(settingsToSave));
};

/**
 * Listens to actions that change settings in this store slice,
 * and calls the function to save them to defaultPreferences.
 */
startAppListening({
	matcher: isAnyOf(setIsRoutingAction, setRoutingLineId),
	effect: async (action, listenerApi) => {
		try {
			await saveToStorage(listenerApi.getState().routing, action.type);
		} catch (err) {
			logError('saveToStorage', err);
		}
	},
});

startAppListening({
	actionCreator: setIsRoutingAction,
	effect: async (action, listenerApi) => {
		if (
			action.payload &&
			listenerApi.getState().dbLoader.initialized &&
			dbConnection?.queryClient
		) {
			listenerApi.dispatch(
				processRouting(dbConnection.queryClient, {
					updateLine: false,
				})
			);
		}
	},
});
