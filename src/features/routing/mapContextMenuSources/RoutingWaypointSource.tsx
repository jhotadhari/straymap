/**
 * External dependencies
 */
import { FC, useEffect, useMemo } from 'react';

/**
 * Internal dependencies
 */
import { MapContextMenuSourceComponentProps, MenuActionOption } from '../../../types';
import { useAppSelector } from '../../../store/hooks';
import { selectIsRouting, selectMovedPointId } from '../selectors';
import { pointIdByMarkerUuid } from '../layerRegistry';
import { getNearestPointHitAtTap } from '../utils';
import useRoute from '../hooks/useRoute';
import usePointActions from '../hooks/usePointActions';

/**
 * Short-press source for a routing waypoint (marker hit while routing is
 * active and no point is being moved): move or delete the tapped point.
 *
 * Resolution: the marker hit's uuid registry first; falls back to a
 * zoom-aware screen-distance (dp) match against the tap position — the
 * same 30 dp tolerance as the Phase A gesture-workaround actions.
 */
const RoutingWaypointSource: FC<MapContextMenuSourceComponentProps> = ({ context, onOptions }) => {
	const movedPointId = useAppSelector(selectMovedPointId);
	const isRouting = useAppSelector(selectIsRouting);
	const { points, id: routeId } = useRoute(['id', 'points']) || {};

	const { movePoint, deletePoint } = usePointActions({ routeId, points });

	const options = useMemo<MenuActionOption[] | null>(() => {
		if (context.press !== 'short' || movedPointId || !isRouting) {
			return null;
		}
		const markerHit = context.hits.find((hit) => hit?.manager === 'markers');
		let pointId = markerHit ? pointIdByMarkerUuid(markerHit.uuid) : null;
		if (pointId == null && points?.length) {
			// Screen-distance fallback from the finger position.
			pointId = getNearestPointHitAtTap(points, context)?.pointId ?? null;
		}
		if (pointId == null) {
			return null;
		}
		return [
			{
				key: 'movePoint',
				label: 'routing.movePoint',
				leadingIcon: 'cursor-move',
				cb: () => movePoint(pointId),
			},
			{
				key: 'deletePoint',
				label: 'routing.deletePoint',
				leadingIcon: 'delete-outline',
				cb: () => deletePoint(pointId),
				disabled: () => (points?.length ?? 0) <= 2,
			},
		];
	}, [
		context,
		deletePoint,
		isRouting,
		movePoint,
		movedPointId,
		points,
	]);

	useEffect(() => {
		onOptions(options);
	}, [onOptions, options]);

	return null;
};

export default RoutingWaypointSource;
