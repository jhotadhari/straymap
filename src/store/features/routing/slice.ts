/**
 * External dependencies
 */
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import { difference, get } from 'lodash-es';

/**
 * Internal dependencies
 */
import { SliceSettingsBase } from '../../../types';
import { RoutingSegment } from './types';
import { AppThunk } from '../../store';
import { aggregateSegmentsToCoords, getCoordsFromRouting, getSegmentRecordId } from './utils';
import { setLineSelected } from '../lines/slice';
import { lineString } from '@turf/turf';
import { createLines, updateLine } from '../lines/db/actionsLine';
import { updateRoute } from './db/actionsRoute';
import { GetTrackParams } from 'react-native-brouter';
import { queryRoute } from './db/queryFns';
import { selectIsRouting } from './selectors';
import { QueryClient } from '@tanstack/react-query';

export interface RoutingSettings {
	isRouting: false | number; // false or routeId.
}

export interface RoutingState extends SliceSettingsBase, RoutingSettings {
	segments: Record<
		string, // fromId_toId
		RoutingSegment
	>;
}

export const initialSettings: RoutingSettings = {
	isRouting: false,
};

const initialState: RoutingState = {
	initialized: false,
	segments: {},
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
			state.segments = {};
			state.isRouting = action.payload;
		},
		setSegment: (state, action: PayloadAction<RoutingSegment>) => {
			const segmentRecordId = getSegmentRecordId(action.payload);
			state.segments[segmentRecordId] = action.payload;
		},
		deleteSegments: (state, action: PayloadAction<(RoutingSegment | string)[]>) => {
			action.payload.forEach((segOrId) => {
				const segmentRecordId =
					'string' === typeof segOrId ? segOrId : getSegmentRecordId(segOrId);
				if (Object.keys(state.segments).includes(segmentRecordId)) {
					delete state.segments[segmentRecordId];
				}
			});
		},
	},
});

// Export the generated action creators for use in components.
export const {
	setInitialized,
	setIsRouting: setIsRoutingAction,
	setSegment,
	deleteSegments,
} = routingSlice.actions;

// Export the slice reducer for use in the store configuration
export default routingSlice.reducer;

export const setIsRouting = (newIsRouting: number | false): AppThunk => {
	return (dispatch, getState) => {
		const isRouting = selectIsRouting(getState());

		if (isRouting !== newIsRouting) {
			dispatch(routingSlice.actions.setIsRouting(newIsRouting));
		}
	};
};

export const deleteSegmentByKeyVal = (key: keyof RoutingSegment, val: any): AppThunk => {
	return (dispatch, getState) => {
		const {
			routing: { segments },
		} = getState();
		const segment = Object.values(segments).find((seg) => get(seg, key) === val);
		if (segment) {
			dispatch(routingSlice.actions.deleteSegments([segment]));
		}
	};
};

const getPointsForRouteId = async (routeId: number | false, queryClient: QueryClient) => {
	if (!routeId) {
		return [];
	}
	await queryClient.refetchQueries({
		queryKey: ['route', routeId],
	});
	const { points } =
		(await queryClient.fetchQuery({
			queryKey: ['route', routeId],
			queryFn: queryRoute,
		})) || {};
	return points ?? [];
};

export const processRouting = (
	queryClient: QueryClient,
	options?: {
		updateLine?: boolean; // defaults to true. Only initializeFromStorage will call that with false.
	}
): AppThunk => {
	return async (dispatch, getState) => {
		if (!queryClient) {
			return;
		}

		const {
			routing: { segments, isRouting: routeId },
		} = getState();

		const points = await getPointsForRouteId(routeId, queryClient);

		// Delete segments not used anymore.
		const newSegmentRecordIds = points
			.map((point, pointIdx) => {
				if (pointIdx >= points.length - 1) {
					return;
				}
				const nextPoint = points[pointIdx + 1];
				const segmentRecordId = [
					point.id,
					nextPoint.id,
				].join('_');
				return segmentRecordId;
			})
			.filter((a) => undefined !== a);
		dispatch(
			routingSlice.actions.deleteSegments(
				difference(Object.keys(segments), newSegmentRecordIds)
			)
		);

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
											newSegment.positions = coords;
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

		if (routeId) {
			if (false !== options?.updateLine) {
				const { lineId, isNew } = await updateLineFromSegments(
					routeId,
					Object.values(updatedSegments),
					queryClient
				);
				if (lineId) {
					dispatch(setLineSelected(lineId, true));
					await queryClient.invalidateQueries({ queryKey: ['lineGeom', lineId] });
					await queryClient.invalidateQueries({ queryKey: ['lines', [lineId]] });
				}
				if (isNew) {
					await queryClient.invalidateQueries({ queryKey: ['lines'], exact: true });
				}
			}
			await queryClient.invalidateQueries({ queryKey: ['route', routeId] });
		}
	};
};

const updateLineFromSegments = async (
	routeId: number,
	segments: RoutingSegment[],
	queryClient: QueryClient
) => {
	if (!routeId) {
		return {};
	}

	if (!segments.some((seg) => seg?.positions?.length ?? 0 > 1)) {
		// Just get out. no line deletion here. stop-routing will handle that case.
		return {};
	}

	queryClient &&
		(await queryClient.refetchQueries({
			queryKey: ['route', routeId],
		}));
	const { line_id } =
		(queryClient &&
			(await queryClient.fetchQuery({
				queryKey: ['route', routeId],
				queryFn: queryRoute,
			}))) ||
		{};

	const coords = aggregateSegmentsToCoords(segments);
	const lineStringFeature = lineString(coords);
	if (line_id) {
		// Update line with new positions.
		await updateLine(line_id, {
			lineStringFeature,
		}); // ... invalidation handled by outer function after return.
		return {
			lineId: line_id,
			isNew: false,
		};
	} else {
		// Create line and update route with line_id.
		const insertedLines = await createLines([
			{
				lineStringFeature,
			},
		]); // ... invalidation handled by outer function after return.
		if (!insertedLines?.length) {
			return {};
		}
		await updateRoute(routeId, { line_id: insertedLines[0].id });
		return {
			lineId: insertedLines[0].id,
			isNew: true,
		};
	}
};

export const onSetDbPath = (): AppThunk => {
	return (dispatch) => {
		dispatch(routingSlice.actions.setIsRouting(false));
	};
};
