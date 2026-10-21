/**
 * External dependencies
 */
import { useCallback, useContext, useMemo } from 'react';
import { MapEventResponse } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { useAppDispatch } from '../../../../../store/hooks';
import { setGrabbedPointId } from '../../../slice';
import { RoutingGestureHitState } from '../../../types';
import { MapContext } from '../../../../../Context';
import { RoutingGestureHits } from './useActionHitState';

/**
 * Grab the waypoint nearest to the map center. The grabbed point is
 * highlighted on the map and a preview marker follows the center until
 * it is dropped (or routing stops/switches). No-op when the center is
 * not within the gesture threshold of a waypoint (menu entry disabled).
 */
const useActionGrabPoint = ({
	hitState,
	getHits,
	grabbedPointId,
}: {
	hitState: RoutingGestureHitState;
	getHits: (event: MapEventResponse | null) => RoutingGestureHits;
	grabbedPointId: number | null;
}) => {
	const dispatch = useAppDispatch();
	const { currentMapEventRef } = useContext(MapContext);

	const cb = useCallback(() => {
		const pointHit = getHits(currentMapEventRef?.current ?? null).pointHit;
		if (pointHit) {
			dispatch(setGrabbedPointId(pointHit.pointId));
		}
	}, [
		currentMapEventRef,
		dispatch,
		getHits,
	]);

	return useMemo(
		() => ({
			key: 'grabPoint',
			cb,
			label: 'routing.grabPoint',
			disabled: () => !!grabbedPointId || !hitState.pointHit,
			leadingIcon: 'cursor-move',
		}),
		[
			cb,
			grabbedPointId,
			hitState.pointHit,
		]
	);
};

export default useActionGrabPoint;
