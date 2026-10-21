/**
 * External dependencies
 */
import { UseMutationOptions, useMutation } from '@tanstack/react-query';
import { Feature, Point, GeoJsonProperties } from 'geojson';
import { useCallback, useContext, useMemo } from 'react';
import { point } from '@turf/turf';
import { MapEventResponse } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { useAppDispatch } from '../../../../../store/hooks';
import { createRoutingPoints } from '../../../db/actionsRoutingPoint';
import { processRouting } from '../../../slice';
import { RoutingGestureHitState, RoutingPoint } from '../../../types';
import { MapContext } from '../../../../../Context';
import { dbConnection } from '../../../../dbLoader/DBConnection';
import { RoutingGestureHits } from './useActionHitState';

/**
 * Cut the segment under the map center: inserts a new waypoint at the
 * snapped on-segment position, between the segment's two waypoints, and
 * re-runs the routing pipeline. No-op when the center is not within the
 * gesture threshold of a rendered segment (the menu entry is disabled).
 */
const useActionCutSegment = ({
	points,
	routeId,
	hitState,
	getHits,
}: {
	points?: RoutingPoint[];
	routeId?: number;
	hitState: RoutingGestureHitState;
	getHits: (event: MapEventResponse | null) => RoutingGestureHits;
}) => {
	const dispatch = useAppDispatch();
	const { currentMapEventRef } = useContext(MapContext);

	const mutationOptions: UseMutationOptions<
		| {
				id: number;
		  }[]
		| undefined,
		Error,
		{ feature: Feature<Point, GeoJsonProperties>; index: number },
		void
	> = useMemo(
		() => ({
			mutationFn: ({
				feature,
				index,
			}: {
				feature: Feature<Point, GeoJsonProperties>;
				index: number;
			}) => createRoutingPoints([{ feature }], routeId, index),
			onMutate: async () => {
				await dbConnection.queryClient!.cancelQueries({ queryKey: ['route', routeId] });
			},
			onSuccess: async () => {
				await dbConnection.queryClient!.invalidateQueries({ queryKey: ['route', routeId] });
				dbConnection?.queryClient && dispatch(processRouting(dbConnection.queryClient));
			},
		}),
		[
			dispatch,
			routeId,
		]
	);
	const mutation = useMutation(mutationOptions);

	const cb = useCallback(async () => {
		if (!routeId) {
			return;
		}
		// Recompute the exact hit from the live map event — the menu's
		// disabled state may lag the center by one tick.
		const cutHit = getHits(currentMapEventRef?.current ?? null).cutHit;
		if (!cutHit) {
			return;
		}
		const feature = point([
			cutHit.nearest[0],
			cutHit.nearest[1],
			0,
		]);
		mutation.mutate({
			feature,
			index: cutHit.insertIndex,
		});
	}, [
		currentMapEventRef,
		getHits,
		mutation,
		routeId,
	]);

	return useMemo(
		() => ({
			key: 'cutSegment',
			cb,
			label: 'routing.cutSegment',
			disabled: () => !hitState.cutHit || !points?.length,
			leadingIcon: 'content-cut',
		}),
		[
			cb,
			hitState.cutHit,
			points,
		]
	);
};

export default useActionCutSegment;
