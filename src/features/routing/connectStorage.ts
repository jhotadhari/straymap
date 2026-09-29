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
	setLastProfile,
	setLastProfiles,
	setRoutingLineId,
	setSegment,
} from './slice';
import { addBusyKey, removeBusyKey } from '../ui/slice';
import { setActiveKey } from '../bottomDrawer/slice';
import { getChartSourceKey } from '../chart/types';
import { startAppListening } from '../../store/listenerMiddleware';
import { selectInitialized } from './selectors';
import { AppStore } from '../../store/store';
import { dbConnection } from '../dbLoader/DBConnection';
import { selectUnitPrefs } from '../general/selectors';
import { unitToMeters } from '../../lib/formatting';
import { logError } from '../../lib/utils';

const settingsKey = 'routingSettings';
const intervalMigratedKey = 'routingIntervalUnitMigrated';

/**
 * One-time migration: straight-line interval values persisted before the
 * unit-aware interval change were stored in the user's distance unit but
 * interpreted as meters. Convert them once, then set the flag so a later
 * unit switch never re-converts (values are meters from now on).
 */
const migrateStraightLineInterval = (newSettings: Partial<RoutingState>, store: AppStore) => {
	const interval = newSettings?.lastProfiles?.profiles?.straightLine?.options?.interval;
	if (typeof interval !== 'number') {
		return;
	}
	const distUnit = selectUnitPrefs(store.getState()).distance;
	newSettings.lastProfiles!.profiles.straightLine.options.interval = unitToMeters(
		interval,
		distUnit,
		true
	);
};

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
	Promise.all([
		DefaultPreference.get(settingsKey),
		DefaultPreference.get(intervalMigratedKey),
	])
		.then(([newSettingsStr, migratedStr]) => {
			if (newSettingsStr) {
				const newSettings = JSON.parse(newSettingsStr) as Partial<RoutingState>;
				if (migratedStr !== 'true') {
					migrateStraightLineInterval(newSettings, store);
					// Fire-and-forget flag write — restore must not wait.
					DefaultPreference.set(intervalMigratedKey, 'true').catch((err) =>
						logError('routing/intervalMigrated', err)
					);
				}
				if (newSettings?.isRouting) {
					store.dispatch(setIsRoutingAction(newSettings.isRouting));
				}
				if (newSettings?.routingLineId) {
					store.dispatch(setRoutingLineId(newSettings.routingLineId));
				}
				if (newSettings?.lastProfiles) {
					store.dispatch(setLastProfiles(newSettings.lastProfiles));
				}
			}
		})
		.catch((err) => logError('routing/connectStorage', err))
		.finally(() => {
			// Always complete init — a failed storage read or corrupt
			// JSON must degrade to defaults, not hang app startup.
			store.dispatch(setInitialized(true));
		});
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
	matcher: isAnyOf(setIsRoutingAction, setRoutingLineId, setLastProfile, setLastProfiles),
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

// Auto-select the routing chart as the bottom drawer content
// when routing becomes active (the drawer itself stays closed).
startAppListening({
	actionCreator: setIsRoutingAction,
	effect: (action, listenerApi) => {
		if (action.payload) {
			listenerApi.dispatch(setActiveKey(getChartSourceKey.routing()));
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
