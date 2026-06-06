/**
 * External dependencies
 */
import { Feature, Point, GeoJsonProperties } from 'geojson';
import { isAnyOf, PayloadAction, type EnhancedStore } from '@reduxjs/toolkit';
import DefaultPreference from 'react-native-default-preference';
import { get, isEqual, omit, set } from 'lodash-es';

/**
 * Internal dependencies
 */
import {
	RoutingSettings,
	RoutingState,
	initialDb,
	initialSettings,
	setInitialized,
	setIsRouting,
	setPoints,
	setSegments,
	setSegmentsAction,
} from './routingSlice';
import { startAppListening } from '../../listenerMiddleware';
import { updateSegments as updateSegments } from './utils';
import { RoutingPoint, RoutingSegment } from './types';
import { selectInitialized, selectPoints, selectSegments } from './selectors';
import { getRoutesWithPoints } from './db/selectors';
// import { Point } from 'react-native-popover-view/dist/Types';
import { parseSerialized } from '../../../lib/utilsGeneral';

const settingsKey = 'routingSettings';

/**
 * Loads settings from defaultPreferences and dispatches them to the store.
 *
 * Has to be called in index.js after the store got initialized.
 */
export const initializeFromStorage = (store: EnhancedStore) => {
	if (selectInitialized(store.getState())) {
		return;
	}
	DefaultPreference.get(settingsKey)
		.then(async (newSettingsStr) => {
			if (newSettingsStr) {
				const newSettings = JSON.parse(newSettingsStr) as Partial<RoutingState>;
				if (newSettings?.isRouting) {
					store.dispatch(setIsRouting(newSettings.isRouting));
					const routes = await getRoutesWithPoints({
						routeId: newSettings.isRouting,
					});
					if (routes.length) {
						const newPointsFromDb = routes[0].points.map((point) => {
							return {
								...omit(point, 'geometryGeoJSON'),
								geometry: parseSerialized<Point>(point.geometryGeoJSON)!,
							};
						});
						console.log('debug newPointsFromDb', newPointsFromDb); // debug
						store.dispatch(setPoints(newPointsFromDb));
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

// export const saveToDb = (routingState: RoutingState, actionType: string) => {
// 	if (!routingState.initialized) {
// 		return;
// 	}
// 	const toSave: Partial<RoutingSettings> = {};
// 	Object.keys(initialDb).forEach((key) => {
// 		let shouldSave = false;
// 		let valueToSave;
// 		switch (key) {
// 			default:
// 				valueToSave = get(routingState, key);
// 				shouldSave = !isEqual(valueToSave, get(initialSettings, key));
// 		}
// 		if (shouldSave) {
// 			set(toSave, key, valueToSave);
// 		}
// 	});
// 	if (__DEV__ && globalThis.shouldLog.saveToDb) {
// 		console.log('DEBUG saveToDb', settingsKey, actionType, toSave);
// 	}
// 	// DefaultPreference.set(settingsKey, JSON.stringify(settingsToSave));
// };

// /**
//  * Listens to action that change settings in this store slice,
//  * and calls the function to save them to db.
//  */
// startAppListening({
// 	matcher: isAnyOf(
// 		setPoints,
// 		// setSegmentsAction,
// 	),
// 	effect: async (action, listenerApi) => {
// 		saveToDb(listenerApi.getState().routing, action.type);
// 	},
// });

startAppListening({
	matcher: isAnyOf(setPoints),
	effect: async (action: PayloadAction<RoutingPoint[]>, listenerApi) => {
		const dispatchSetSegments = (newSegments: RoutingSegment[]) =>
			listenerApi.dispatch(setSegments(newSegments, { filter: true }));
		updateSegments(action.payload, selectSegments(listenerApi.getState()), dispatchSetSegments);
	},
});

startAppListening({
	matcher: isAnyOf(setSegmentsAction),
	effect: async (
		action: PayloadAction<{
			segments: RoutingSegment[];
			updateRoutes: boolean;
		}>,
		listenerApi
	) => {
		if ( ! action.payload?.updateRoutes ) {
			return;
		}
		const dispatchSetSegments = (newSegments: RoutingSegment[]) =>
			listenerApi.dispatch(setSegments(newSegments, {
				filter: true,
			}));
		updateSegments(selectPoints(listenerApi.getState()), action.payload.segments, dispatchSetSegments);
	},
});
