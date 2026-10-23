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
import { deleteSegments, setMovedPointId } from '../../../slice';
import { RoutingGestureHitState, RoutingPoint } from '../../../types';
import { MapContext } from '../../../../../Context';
import { dbConnection } from '../../../../dbLoader/DBConnection';
import { RoutingGestureHits } from './useActionHitState';

/**
 * Cut the segment under the map center: inserts a new waypoint at the
 * snapped on-segment position, between the segment's two waypoints.
 * The new point is immediately set to move mode (drag mode) and the cut
 * segment's cached geometry is deleted, so both adjacent segments
 * render as blue fallback placeholders that follow the map center. The
 * routing pipeline only re-runs when the point is dropped.
 *
 * No-op when the center is not within the gesture threshold of a
 * rendered segment or while another point is being moved (menu entry
 * disabled).
 */
const useActionCutSegment = ({
	points,
	routeId,
	hitState,
	getHits,
	movedPointId,
}: {
	points?: RoutingPoint[];
	routeId?: number;
	hitState: RoutingGestureHitState;
	getHits: (event: MapEventResponse | null) => RoutingGestureHits;
	movedPointId: number | null;
}) => {
	const dispatch = useAppDispatch();
	const { currentMapEventRef } = useContext(MapContext);

	const mutationOptions: UseMutationOptions<
		| {
				id: number;
		  }[]
		| undefined,
		Error,
		{ feature: Feature<Point, GeoJsonProperties>; index: number; segmentRecordId: string },
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
			onSuccess: async (data, variables) => {
				// Immediately start moving the new cut point and drop
				// the cut segment's cached geometry so the adjacent
				// segments render as live fallback placeholders. Routing
				// is deferred until the point is dropped.
				const newPointId = data?.[0]?.id;
				if (newPointId) {
					dispatch(setMovedPointId(newPointId));
				}
				dispatch(deleteSegments([variables.segmentRecordId]));
				await dbConnection.queryClient!.invalidateQueries({ queryKey: ['route', routeId] });
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
			segmentRecordId: cutHit.segmentRecordId,
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
			disabled: () => !!movedPointId || !hitState.cutHit || !points?.length,
			leadingIcon: 'content-cut',
		}),
		[
			cb,
			movedPointId,
			hitState.cutHit,
			points,
		]
	);
};

export default useActionCutSegment;
