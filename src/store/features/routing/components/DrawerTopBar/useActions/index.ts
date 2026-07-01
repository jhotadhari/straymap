/**
 * External dependencies
 */
import { useMemo } from 'react';

/**
 * Internal dependencies
 */
import { MenuActionOption } from '../../../../../../types';
import { RoutingPoint } from '../../../types';
import useActionAppendPoint from './useActionAppendPoint';
import useActionDeleteLastPoint from './useActionDeleteLastPoint';

const useActions = ({ points, routeId }: { points?: RoutingPoint[]; routeId?: number }) => {
	const actionAppendPoint = useActionAppendPoint({ points, routeId });
	const actionDeleteLastPoint = useActionDeleteLastPoint({ points, routeId });

	return useMemo(() => {
		const actions: Record<string, MenuActionOption> = {};

		actions[actionAppendPoint.key] = actionAppendPoint;
		actions[actionDeleteLastPoint.key] = actionDeleteLastPoint;

		return actions;
	}, [actionAppendPoint, actionDeleteLastPoint]);
};

export default useActions;
