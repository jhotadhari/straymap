/**
 * Internal dependencies
 */
import { MenuActionOption } from '../../../../../../types';
import { RoutingPoint } from '../../../types';
import useActionAppendPoint from './useActionAppendPoint';
import useActionDeleteLastPoint from './useActionDeleteLastPoint';

const useActions = ({ points, routeId }: { points?: RoutingPoint[]; routeId?: number }) => {
	const actions: Record<string, MenuActionOption> = {};

	const actionAppendPoint = useActionAppendPoint({ points, routeId });
	actions[actionAppendPoint.key] = actionAppendPoint;

	const actionDeleteLastPoint = useActionDeleteLastPoint({ points, routeId });
	actions[actionDeleteLastPoint.key] = actionDeleteLastPoint;

	return actions;
};

export default useActions;
