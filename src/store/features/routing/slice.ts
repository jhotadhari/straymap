/**
 * External dependencies
 */
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import { SliceSettingsBase } from '../../../types';
import { RoutingPoint, RoutingSegment, RoutingTriggeredSegment } from './types';
import { AppThunk } from '../../store';
import { aggregateSegmentsToCoords, getCoordsFromRouting, getSegmentRecordId } from './utils';
import { setLineSelected } from '../lines/slice';
import { lineString } from '@turf/turf';
import { createLines, updateLine } from '../lines/db/actionsLine';
import { updateRoute } from './db/actionsRoute';
import { GetTrackParams } from 'react-native-brouter';
import { queryClient } from '../../../db/clients';
import { lineStringToStats } from '../../../lib/utils';
import { LineStats } from '../lines/types';
import { queryRoutes, queryRoutingLineId } from './db/queries';

export interface RoutingSettings {
	isRouting: false | number; // false or routeId.
}

export interface RoutingState extends SliceSettingsBase, RoutingSettings {
	segments: Record<
		string, // fromId_toId
		RoutingSegment
	>;
	markerLayerUuid: null | string;
	pathLayerUuids: null | string[];
	movingPointIdx?: number;
	triggeredMarkerIdx?: number;
	triggeredSegment?: RoutingTriggeredSegment;
	stats: LineStats;
}

export const initialSettings: RoutingSettings = {
	isRouting: false,
};

const initialState: RoutingState = {
	initialized: false,
	markerLayerUuid: null,
	pathLayerUuids: null,
	segments: {},
	stats: {},
	...initialSettings,
};

// Slices contain Redux reducer logic for updating state, and
// generate actions that can be dispatched to trigger those updates.
export const routingSlice = createSlice({
	name: 'routing',
	initialState,
	reducers: {
		setInitialized: (state, action: PayloadAction<boolean>) => {
			state.initialized = action.payload;
		},
		setIsRouting: (state, action: PayloadAction<RoutingState['isRouting']>) => {
			if (state.isRouting !== action.payload || !action.payload) {
				state.segments = {};
				state.movingPointIdx = undefined;
			}
			state.isRouting = action.payload;
		},
		// setSegments: (
		// 	state,
		// 	action: PayloadAction<{
		// 		segments: RoutingState['segments'];
		// 		updateRoutes: boolean;
		// 		updateLine: boolean;
		// 	}>
		// ) => {
		// 	state.segments = action.payload.segments;
		// },
		setSegment: (state, action: PayloadAction<RoutingSegment>) => {
			const segmentRecordId = getSegmentRecordId(action.payload);
			state.segments[segmentRecordId] = action.payload;
		},
		deleteSegment: (state, action: PayloadAction<RoutingSegment>) => {
			const segmentRecordId = getSegmentRecordId(action.payload);
			delete state.segments[segmentRecordId];
		},
		setMarkerLayerUuid: (state, action: PayloadAction<RoutingState['markerLayerUuid']>) => {
			state.markerLayerUuid = action.payload;
		},
		setPathLayerUuids: (state, action: PayloadAction<RoutingState['pathLayerUuids']>) => {
			state.pathLayerUuids = action.payload;
		},

		setMovingPointIdx: (state, action: PayloadAction<RoutingState['movingPointIdx']>) => {
			state.movingPointIdx = action.payload;
		},
		setTriggeredMarkerIdx: (
			state,
			action: PayloadAction<RoutingState['triggeredMarkerIdx']>
		) => {
			state.triggeredMarkerIdx = action.payload;
		},
		setTriggeredSegment: (state, action: PayloadAction<RoutingState['triggeredSegment']>) => {
			state.triggeredSegment = action.payload;
		},
		setStats: (state, action: PayloadAction<RoutingState['stats']>) => {
			state.stats = action.payload;
		},
	},
});

// Export the generated action creators for use in components.
export const {
	setInitialized,
	setIsRouting,
	// setSegments: setSegmentsAction,
	setSegment,
	deleteSegment,
	setMarkerLayerUuid,
	setPathLayerUuids,
	setMovingPointIdx,
	setTriggeredMarkerIdx,
	setTriggeredSegment,
	setStats,
} = routingSlice.actions;

// Export the slice reducer for use in the store configuration
export default routingSlice.reducer;

// export const setSegments = (
// 	segments: Record<string, RoutingSegment>,
// 	options?: {
// 		filter?: boolean;
// 		updateRoutes?: boolean;
// 		updateLine?: boolean; // defaults to true.
// 	}
// ): AppThunk => {
// 	return (dispatch, getState) => {
// 		if (options?.filter) {
// 			const pointIds = selectPointIds(getState());
// 			dispatch(
// 				routingSlice.actions.setSegments({
// 					segments: omit(
// 						segments,
// 						Object.keys(segments).filter((fromId_toId) => {
// 							const { fromId, toId } = segments[fromId_toId];
// 							return !pointIds.includes(fromId) || !pointIds.includes(toId);
// 						})
// 					),
// 					updateRoutes: !!options?.updateRoutes,
// 					updateLine: false !== options?.updateLine,
// 				})
// 			);
// 		} else {
// 			dispatch(
// 				routingSlice.actions.setSegments({
// 					segments,
// 					updateRoutes: !!options?.updateRoutes,
// 					updateLine: false !== options?.updateLine,
// 				})
// 			);
// 		}
// 	};
// };

export const deleteSegmentByKeyVal = (key: keyof RoutingSegment, val: any): AppThunk => {
	return (dispatch, getState) => {
		const {
			routing: { segments },
		} = getState();
		const segment = Object.values(segments).find((seg) => get(seg, key) === val);
		if (segment) {
			dispatch(routingSlice.actions.deleteSegment(segment));
		}
	};
};

const getPointsForRouteId = async (routeId: number | false) => {
	if (!routeId) {
		return [];
	}
	const routes = await queryClient.fetchQuery({
		// ??? maybe should use queryRoutes routes directX.
		queryKey: ['routes', routeId],
		queryFn: () => queryRoutes({ routeId: routeId }),
	});
	const points: RoutingPoint[] = get(routes, [0, 'points'], []);
	return points;
};

export const filterSegments = (): AppThunk => {
	return async (dispatch, getState) => {
		const {
			routing: { segments, isRouting: routeId },
		} = getState();
		const points = await getPointsForRouteId(routeId);
		const pointIds = points.map((p) => p.id);
		Object.keys(segments)
			.filter((fromId_toId) => {
				const { fromId, toId } = segments[fromId_toId];
				return !pointIds.includes(fromId) || !pointIds.includes(toId);
			})
			.map((fromId_toId) =>
				dispatch(routingSlice.actions.deleteSegment(segments[fromId_toId]))
			);
	};
};

export const processRouting = (options?: {
	updateLine?: boolean; // defaults to true. Only initializeFromStorage will call that with false.
}): AppThunk => {
	return async (dispatch, getState) => {
		const {
			routing: { segments, isRouting: routeId },
		} = getState();
		const points = await getPointsForRouteId(routeId);

		const updatedSegments = await new Promise<Record<string, RoutingSegment>>(
			(resolveOuter) => {
				points
					.reduce(
						(segmentsPromise, point, pointIdx) => {
							return segmentsPromise.then((newSegments) => {
								return new Promise((resolve) => {
									if (pointIdx >= points.length - 1) {
										resolve(newSegments);
										return;
									}

									const nextPoint = points[pointIdx + 1];

									const segmentRecordId = [
										point.id,
										nextPoint.id,
									].join('_');

									const segment = get(segments, segmentRecordId);

									if (segment && (!segment.isFetching || segment.positions)) {
										newSegments[segmentRecordId] = segment;
										resolve(newSegments);
										return;
									}

									const newSegment: RoutingSegment = {
										...(segment ?? {}),
										fromId: point.id,
										toId: nextPoint.id,
										isFetching: true,
									};

									newSegments[segmentRecordId] = newSegment;
									dispatch(
										routingSlice.actions.setSegment({
											...newSegment, // spread, because it has to be a new reference. Otherwise newSegment would be read only after dispatching it.
										})
									);

									const params: GetTrackParams = {
										lonlats: [
											[
												point.geometry.coordinates[0],
												point.geometry.coordinates[1],
											].join(','),
											[
												nextPoint.geometry.coordinates[0],
												nextPoint.geometry.coordinates[1],
											].join(','),
										].join('|'),
										trackFormat: 'json',
										fast: point?.profile?.fast,
										v: point?.profile?.v,
									};

									getCoordsFromRouting({
										params,
										hasDelay: !!pointIdx,
									})
										.then((coords) => {
											const positions = coords.map((coord) => ({
												lng: coord[0],
												lat: coord[1],
												alt: coord[2],
											}));
											newSegment.positions = positions;
											newSegment.isFetching = false;
											newSegments[segmentRecordId] = newSegment;
											dispatch(routingSlice.actions.setSegment(newSegment));
											resolve(newSegments);
										})
										.catch((errorMsg) => {
											newSegment.errorMsg = errorMsg;
											newSegment.isFetching = false;
											newSegments[segmentRecordId] = newSegment;
											dispatch(routingSlice.actions.setSegment(newSegment));
											resolve(newSegments);
										});
								});
							});
						},
						Promise.resolve({} as Record<string, RoutingSegment>)
					)
					.then((newSegments) => {
						resolveOuter(newSegments);
					});
			}
		);

		dispatch(filterSegments());

		if (routeId) {
			if (false !== options?.updateLine) {
				const lineId = await updateLineFromSegments(
					routeId,
					Object.values(updatedSegments)
				);
				if (lineId) {
					dispatch(setLineSelected(lineId, true));
				}
			}
			// invalidateQueries
			// No need to invalidate lines queries with selectedIds, because either selectedIds changed, or line info changed that components don't care-
			await queryClient.invalidateQueries({ queryKey: ['routingLineId', routeId] });
			// Update routing stats.
			if (Object.keys(updatedSegments).length) {
				const stats = await lineStringToStats(
					lineString(aggregateSegmentsToCoords(Object.values(updatedSegments))).geometry
				);
				dispatch(routingSlice.actions.setStats(stats ?? {}));
			} else {
				dispatch(routingSlice.actions.setStats({}));
			}
		}
	};
};

const updateLineFromSegments = async (routeId: number, segments: RoutingSegment[]) => {
	if (!routeId) {
		return;
	}

	if (!segments.some((seg) => seg?.positions?.length ?? 0 > 1)) {
		// Just get out. no line deletion here. stop-routing will handle that case.
		return;
	}

	const lineId = await queryClient.fetchQuery({
		queryKey: ['routingLineId', routeId],
		queryFn: () => queryRoutingLineId(routeId),
	});

	const coords = aggregateSegmentsToCoords(segments);
	const lineStringFeature = lineString(coords);
	if (lineId) {
		// Update line with new positions.
		await updateLine(lineId, {
			lineStringFeature,
		}); // ... invalidation handled by outer function after return.

		return lineId;
	} else {
		// Create line and update route with line_id.
		const insertedLines = await createLines([
			{
				lineStringFeature,
			},
		]); // ... invalidation handled by outer function after return.
		if (!insertedLines?.length) {
			return undefined;
		}
		await updateRoute(routeId, { line_id: insertedLines[0].id });
		return insertedLines[0].id;
	}
};
