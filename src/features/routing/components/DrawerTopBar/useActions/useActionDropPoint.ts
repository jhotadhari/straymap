/**
 * External dependencies
 */
import { UseMutationOptions, useMutation } from '@tanstack/react-query';
import { Feature, Point, GeoJsonProperties } from 'geojson';
import { useCallback, useContext, useMemo } from 'react';
import { point } from '@turf/turf';

/**
 * Internal dependencies
 */
import { useAppDispatch } from '../../../../../store/hooks';
import { updateRoutingPoint } from '../../../db/actionsRoutingPoint';
import { deleteSegments, processRouting, setMovedPointId } from '../../../slice';
import { RoutingPoint } from '../../../types';
import { getAdjacentSegmentRecordIds } from '../../../utils';
import { MapContext } from '../../../../../Context';
import { dbConnection } from '../../../../dbLoader/DBConnection';
import { pointsCoordsAreOverlapping } from '../../../../../lib/utils';

/**
 * Drop the moved waypoint at the current map center: moves its
 * geometry there, deletes the adjacent segments so processRouting
 * refetches them (moving a point keeps the same segment record ids, so
 * without the deletion the cached stale geometry would be reused), and
 * re-runs the routing pipeline. The move state is cleared on success.
 * No-op when no point is being moved (menu entry disabled) or when the
 * center overlaps another existing waypoint.
 */
const useActionDropPoint = ({
	points,
	routeId,
	movedPointId,
}: {
	points?: RoutingPoint[];
	routeId?: number;
	movedPointId: number | null;
}) => {
	const dispatch = useAppDispatch();
	const { currentMapEventRef } = useContext(MapContext);

	const mutationOptions: UseMutationOptions<
		void,
		Error,
		{ feature: Feature<Point, GeoJsonProperties> },
		void
	> = useMemo(
		() => ({
			mutationFn: ({ feature }: { feature: Feature<Point, GeoJsonProperties> }) => {
				if (!movedPointId) {
					return Promise.resolve();
				}
				return updateRoutingPoint(movedPointId, { feature });
			},
			onMutate: async () => {
				await dbConnection.queryClient!.cancelQueries({ queryKey: ['route', routeId] });
			},
			onSuccess: async () => {
				dispatch(setMovedPointId(null));
				await dbConnection.queryClient!.invalidateQueries({ queryKey: ['route', routeId] });
				dbConnection?.queryClient && dispatch(processRouting(dbConnection.queryClient));
			},
		}),
		[
			dispatch,
			movedPointId,
			routeId,
		]
	);
	const mutation = useMutation(mutationOptions);

	const cb = useCallback(async () => {
		if (!routeId || !movedPointId) {
			return;
		}
		const center = currentMapEventRef?.current?.center;
		if (!center || center.length < 2) {
			return;
		}
		// Guard against dropping onto another existing waypoint.
		if (
			points?.some(
				(p) =>
					p.id !== movedPointId &&
					pointsCoordsAreOverlapping(p.geometry.coordinates, center)
			)
		) {
			return;
		}
		// Delete the adjacent segments before mutating — processRouting
		// would otherwise reuse the cached (stale) geometry for the
		// unchanged segment record ids.
		if (points) {
			dispatch(deleteSegments(getAdjacentSegmentRecordIds(points, movedPointId)));
		}
		const feature = point([
			center[0],
			center[1],
			0,
		]);
		mutation.mutate({
			feature,
		});
	}, [
		currentMapEventRef,
		dispatch,
		movedPointId,
		mutation,
		points,
		routeId,
	]);

	return useMemo(
		() => ({
			key: 'dropPoint',
			cb,
			label: 'routing.dropPoint',
			disabled: () => !movedPointId,
			leadingIcon: 'arrow-down-bold-outline',
		}),
		[cb, movedPointId]
	);
};

export default useActionDropPoint;
