/**
 * External dependencies
 */
import { FC, useEffect, useMemo } from 'react';

/**
 * Internal dependencies
 */
import { MapContextMenuSourceComponentProps, MenuActionOption } from '../../../types';
import { useAppSelector } from '../../../store/hooks';
import { selectMovedPointId } from '../selectors';
import useRoute from '../hooks/useRoute';
import usePointActions from '../hooks/usePointActions';

/**
 * Long-press source shown while a waypoint is being moved — it overrides
 * the other routing sources: any long-press while moving offers dropping
 * the point at the press position or discarding the move.
 */
const RoutingMovingSource: FC<MapContextMenuSourceComponentProps> = ({ context, onOptions }) => {
	const movedPointId = useAppSelector(selectMovedPointId);
	const { points, id: routeId } = useRoute(['id', 'points']) || {};

	const { dropPointAt, discardMoving } = usePointActions({ routeId, points });

	const options = useMemo<MenuActionOption[] | null>(() => {
		if (context.press !== 'long' || !movedPointId) {
			return null;
		}
		return [
			{
				key: 'dropPointHere',
				label: 'routing.dropPointHere',
				leadingIcon: 'arrow-down-bold-outline',
				cb: () => dropPointAt([context.lng, context.lat]),
			},
			{
				key: 'discardMoving',
				label: 'routing.discardMoving',
				leadingIcon: 'close',
				cb: discardMoving,
			},
		];
	}, [
		context,
		discardMoving,
		dropPointAt,
		movedPointId,
	]);

	useEffect(() => {
		onOptions(options);
	}, [onOptions, options]);

	return null;
};

export default RoutingMovingSource;
