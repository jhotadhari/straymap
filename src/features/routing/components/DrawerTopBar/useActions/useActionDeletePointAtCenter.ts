/**
 * External dependencies
 */
import { UseMutationOptions, useMutation } from '@tanstack/react-query';
import { useCallback, useContext, useMemo } from 'react';
import { MapEventResponse } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../../../store/hooks';
import { deleteRoutingPoint } from '../../../db/actionsRoutingPoint';
import { processRouting, setMovedPointId } from '../../../slice';
import { RoutingGestureHitState, RoutingPoint } from '../../../types';
import { selectMovedPointId } from '../../../selectors';
import { MapContext } from '../../../../../Context';
import { dbConnection } from '../../../../dbLoader/DBConnection';
import { RoutingGestureHits } from './useActionHitState';

/**
 * Delete the waypoint nearest to the map center. Keeps at least two
 * waypoints on the route (menu entry disabled below that). Clearing the
 * move state when the deleted point is the one being moved is handled in
 * onSuccess. No-op when the center is not within the gesture threshold
 * of a waypoint (menu entry disabled).
 */
const useActionDeletePointAtCenter = ({
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
	const movedPointId = useAppSelector(selectMovedPointId);
	const { currentMapEventRef } = useContext(MapContext);

	const mutationOptions: UseMutationOptions<void, Error, number, void> = useMemo(
		() => ({
			mutationFn: (id: number) => deleteRoutingPoint(id),
			onMutate: async () => {
				await dbConnection.queryClient!.cancelQueries({ queryKey: ['route', routeId] });
			},
			onSuccess: async (_data, id) => {
				if (movedPointId === id) {
					dispatch(setMovedPointId(null));
				}
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

	const cb = useCallback(() => {
		if (!routeId) {
			return;
		}
		const pointHit = getHits(currentMapEventRef?.current ?? null).pointHit;
		if (!pointHit) {
			return;
		}
		mutation.mutate(pointHit.pointId);
	}, [
		currentMapEventRef,
		getHits,
		mutation,
		routeId,
	]);

	return useMemo(
		() => ({
			key: 'deletePointAtCenter',
			cb,
			label: 'routing.deletePointAtCenter',
			disabled: () => !!movedPointId || !hitState.pointHit || (points?.length ?? 0) <= 2,
			leadingIcon: 'delete-outline',
		}),
		[
			cb,
			movedPointId,
			hitState.pointHit,
			points,
		]
	);
};

export default useActionDeletePointAtCenter;
