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
	checkBrouterAvailability,
	initialSettings,
	processRouting,
	setInitialized,
	setIsRoutingAction,
	setRoutingLineId,
	setSegment,
} from './slice';
import { addBusyKey, removeBusyKey } from '../ui/slice';
import { startAppListening } from '../../store/listenerMiddleware';
import { selectInitialized } from './selectors';
import { AppStore } from '../../store/store';
import { dbConnection } from '../dbLoader/DBConnection';
import { logError } from '../../lib/utils';

const settingsKey = 'routingSettings';

/**
 * Loads settings from defaultPreferences and dispatches them to the store.
 */
export const initializeFromStorage = (store: AppStore) => {
	if (selectInitialized(store.getState())) {
		return;
	}
	// Check BRouter availability on init (fire-and-forget —
	// doesn't block the rest of initialization).
	store.dispatch(checkBrouterAvailability());
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
		if (!action.payload) {
			// Routing stopped.  Don't clear the busy key here — an
			// in-flight processRouting may still be computing segments
			// and updating the DB.  The setSegment listener below will
			// clear the key when the last segment finishes.
			return;
		}

		if (listenerApi.getState().dbLoader.initialized && dbConnection?.queryClient) {
			listenerApi.dispatch(
				processRouting(dbConnection.queryClient, {
					updateLine: false,
				})
			);
		}
	},
});

// Busy key 'routing:calc': set when any segment is being fetched from brouter.
let routingCalcBusy = false;
startAppListening({
	actionCreator: setSegment,
	effect: (_action, listenerApi) => {
		const segments = listenerApi.getState().routing.segments;
		const hasFetching = Object.values(segments).some((seg) => seg?.isFetching === true);
		if (hasFetching && !routingCalcBusy) {
			routingCalcBusy = true;
			listenerApi.dispatch(addBusyKey('routing:calc'));
		} else if (!hasFetching && routingCalcBusy) {
			routingCalcBusy = false;
			listenerApi.dispatch(removeBusyKey('routing:calc'));
		}
	},
});
