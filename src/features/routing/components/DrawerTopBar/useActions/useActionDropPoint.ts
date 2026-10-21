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
import { processRouting, setGrabbedPointId } from '../../../slice';
import { RoutingPoint } from '../../../types';
import { MapContext } from '../../../../../Context';
import { dbConnection } from '../../../../dbLoader/DBConnection';
import { pointsCoordsAreOverlapping } from '../../../../../lib/utils';

/**
 * Drop the grabbed waypoint at the current map center: moves its
 * geometry there and re-runs the routing pipeline. The grab state is
 * cleared on success. No-op when nothing is grabbed (menu entry
 * disabled) or when the center overlaps another existing waypoint.
 */
const useActionDropPoint = ({
	points,
	routeId,
	grabbedPointId,
}: {
	points?: RoutingPoint[];
	routeId?: number;
	grabbedPointId: number | null;
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
				if (!grabbedPointId) {
					return Promise.resolve();
				}
				return updateRoutingPoint(grabbedPointId, { feature });
			},
			onMutate: async () => {
				await dbConnection.queryClient!.cancelQueries({ queryKey: ['route', routeId] });
			},
			onSuccess: async () => {
				dispatch(setGrabbedPointId(null));
				await dbConnection.queryClient!.invalidateQueries({ queryKey: ['route', routeId] });
				dbConnection?.queryClient && dispatch(processRouting(dbConnection.queryClient));
			},
		}),
		[
			dispatch,
			grabbedPointId,
			routeId,
		]
	);
	const mutation = useMutation(mutationOptions);

	const cb = useCallback(async () => {
		if (!routeId || !grabbedPointId) {
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
					p.id !== grabbedPointId &&
					pointsCoordsAreOverlapping(p.geometry.coordinates, center)
			)
		) {
			return;
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
		grabbedPointId,
		mutation,
		points,
		routeId,
	]);

	return useMemo(
		() => ({
			key: 'dropPoint',
			cb,
			label: 'routing.dropPoint',
			disabled: () => !grabbedPointId,
			leadingIcon: 'arrow-down-bold',
		}),
		[cb, grabbedPointId]
	);
};

export default useActionDropPoint;
