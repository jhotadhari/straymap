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
import { segmentRecordIdByUuid } from '../layerRegistry';
import { getNearestPointHitAtTap } from '../utils';
import useRoute from '../hooks/useRoute';
import usePointActions from '../hooks/usePointActions';

/**
 * Long-press source for the feature-less map while routing is active:
 * appends a routing waypoint at the pressed position. (A future waypoint
 * feature will add its own "Add waypoint here" action.)
 */
const RoutingMapSource: FC<MapContextMenuSourceComponentProps> = ({ context, onOptions }) => {
	const movedPointId = useAppSelector(selectMovedPointId);
	const isRouting = useAppSelector(selectIsRouting);
	const { points, id: routeId } = useRoute(['id', 'points']) || {};

	const { appendPointAt } = usePointActions({ routeId, points });

	const options = useMemo<MenuActionOption[] | null>(() => {
		if (context.press !== 'long' || movedPointId || !isRouting) {
			return null;
		}
		// Only when no routing feature was hit: waypoints (screen-distance
		// check), ramp segments, or routing fallback paths all disqualify
		// the empty-map append.
		const routingHit =
			(points ? !!getNearestPointHitAtTap(points, context) : false) ||
			context.hits.some(
				(hit) =>
					hit?.manager === 'paths_colorramp' ||
					(hit?.manager === 'paths' && segmentRecordIdByUuid(hit.uuid) !== null)
			);
		if (routingHit) {
			return null;
		}
		return [
			{
				key: 'appendRoutingHere',
				label: 'routing.appendRoutingHere',
				leadingIcon: 'plus',
				cb: () => appendPointAt([context.lng, context.lat]),
			},
		];
	}, [
		appendPointAt,
		context,
		isRouting,
		movedPointId,
		points,
	]);

	useEffect(() => {
		onOptions(options);
	}, [onOptions, options]);

	return null;
};

export default RoutingMapSource;
