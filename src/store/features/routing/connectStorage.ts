/**
 * External dependencies
 */
import { isAnyOf, type EnhancedStore } from '@reduxjs/toolkit';
import DefaultPreference from 'react-native-default-preference';
import { get, isEqual, set } from 'lodash-es';
import { lineString } from '@turf/helpers';

/**
 * Internal dependencies
 */
import {
	RoutingSettings,
	RoutingState,
	initialSettings,
	setInitialized,
	setIsRouting,
	setPointsAction,
	setSegments,
	setSegmentsAction,
} from './routingSlice';
import { startAppListening } from '../../listenerMiddleware';
import { updateSegments as updateSegments } from './utils';
import { RoutingSegment } from './types';
import { selectInitialized, selectIsRouting, selectPoints, selectSegments } from './selectors';
import { getRoutesWithPoints } from './db/selectors';
import { createLines, updateLine } from '../lines/db/actionsLine';
import { updateRoute } from './db/actionsRoute';

const settingsKey = 'routingSettings';

/**
 * Loads settings from defaultPreferences and dispatches them to the store.
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

// ??? move helper fn somewhere else
const aggregateSegmentsToCoords = (segments: RoutingSegment[]) =>
	segments.reduce((acc, seg) => {
		seg?.positions?.forEach((pos) => {
			acc.push([
				pos.lng,
				pos.lat,
				...(undefined === pos?.alt ? [] : [pos?.alt]),
			]);
		});
		return acc;
	}, [] as number[][]);

// ??? move helper fn somewhere else
// ??? this should be done by query mutation somehow
const updateLineFromSegments = async (routeId: number, segments: RoutingSegment[]) => {
	if (!routeId) {
		return;
	}

	if (!segments.some((seg) => seg?.positions?.length)) {
		// ??? delete line if no positions ???.... NO Deletion now, but maybe delete on stop routing.

		return;
	}

	const routes = await getRoutesWithPoints({ routeId });
	if (!routes.length) {
		return;
	}
	const coords = aggregateSegmentsToCoords(segments);
	const lineStringFeature = lineString(coords);
	if (routes[0].line_id) {
		// Update line with new positions.
		await updateLine(routes[0].line_id, {
			lineStringFeature,
		});
	} else {
		// Create line and update route with line_id.
		const insertedLines = await createLines([
			{
				lineStringFeature,
			},
		]);

		if (!insertedLines?.length) {
			return undefined;
		}
		await updateRoute(routeId, { line_id: insertedLines[0].id });
	}
};

startAppListening({
	actionCreator: setPointsAction,
	effect: async (action, listenerApi) => {
		const dispatchSetSegments = (newSegments: RoutingSegment[]) =>
			listenerApi.dispatch(setSegments(newSegments, { filter: true }));
		const updatedSegments = await updateSegments(
			action.payload.points,
			selectSegments(listenerApi.getState()),
			dispatchSetSegments
		);
		if (action.payload.updateLine) {
			const routeId = selectIsRouting(listenerApi.getState());
			routeId && updateLineFromSegments(routeId, updatedSegments);
		}
	},
});

startAppListening({
	actionCreator: setSegmentsAction,
	effect: async (action, listenerApi) => {
		if (!action.payload?.updateRoutes) {
			return;
		}
		const dispatchSetSegments = (newSegments: RoutingSegment[]) =>
			listenerApi.dispatch(
				setSegments(newSegments, {
					filter: true,
				})
			);
		const updatedSegments = await updateSegments(
			selectPoints(listenerApi.getState()),
			action.payload.segments,
			dispatchSetSegments
		);
		if (action.payload.updateLine) {
			const routeId = selectIsRouting(listenerApi.getState());
			routeId && updateLineFromSegments(routeId, updatedSegments);
		}
	},
});
