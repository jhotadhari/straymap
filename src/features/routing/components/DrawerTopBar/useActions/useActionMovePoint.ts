/**
 * External dependencies
 */
import { useCallback, useContext, useMemo } from 'react';
import { MapEventResponse } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { useAppDispatch } from '../../../../../store/hooks';
import { deleteSegments, processRouting, setMovedPointId } from '../../../slice';
import { RoutingGestureHitState, RoutingPoint } from '../../../types';
import { getAdjacentSegmentRecordIds } from '../../../utils';
import { MapContext } from '../../../../../Context';
import { dbConnection } from '../../../../dbLoader/DBConnection';
import { RoutingGestureHits } from './useActionHitState';

/**
 * Move the waypoint nearest to the map center. The moved point is
 * highlighted on the map and its adjacent segments switch to the blue
 * fallback placeholders, which follow the map center until the point is
 * dropped (or routing stops/switches). No-op when the center is not
 * within the gesture threshold of a waypoint (menu entry disabled).
 *
 * While a point is being moved, this same menu entry becomes "Discard
 * moving": it exits move mode (leaving the point's DB geometry
 * untouched) and re-runs the routing pipeline to recompute the adjacent
 * segments.
 */
const useActionMovePoint = ({
	points,
	hitState,
	getHits,
	movedPointId,
}: {
	points?: RoutingPoint[];
	hitState: RoutingGestureHitState;
	getHits: (event: MapEventResponse | null) => RoutingGestureHits;
	movedPointId: number | null;
}) => {
	const dispatch = useAppDispatch();
	const { currentMapEventRef } = useContext(MapContext);

	const cb = useCallback(() => {
		if (movedPointId) {
			// Discard moving: exit move mode without touching the DB
			// geometry, then recompute the adjacent segments.
			dispatch(setMovedPointId(null));
			dbConnection?.queryClient &&
				dispatch(processRouting(dbConnection.queryClient));
			return;
		}
		const pointHit = getHits(currentMapEventRef?.current ?? null).pointHit;
		if (!pointHit) {
			return;
		}
		// Delete the adjacent segments so the stale brouter geometry is
		// replaced by the live fallback placeholders while moving.
		if (points) {
			dispatch(deleteSegments(getAdjacentSegmentRecordIds(points, pointHit.pointId)));
		}
		dispatch(setMovedPointId(pointHit.pointId));
	}, [
		currentMapEventRef,
		dispatch,
		getHits,
		movedPointId,
		points,
	]);

	return useMemo(
		() => ({
			key: 'movePoint',
			cb,
			label: movedPointId ? 'routing.discardMoving' : 'routing.movePoint',
			disabled: () => (movedPointId ? false : !hitState.pointHit),
			leadingIcon: movedPointId ? 'close' : 'cursor-move',
		}),
		[cb, movedPointId, hitState.pointHit]
	);
};

export default useActionMovePoint;
