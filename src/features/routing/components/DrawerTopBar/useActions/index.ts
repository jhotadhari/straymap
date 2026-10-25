/**
 * External dependencies
 */
import { useMemo } from 'react';

/**
 * Internal dependencies
 */
import { MenuActionOption } from '../../../../../types';
import { RoutingPoint } from '../../../types';
import { useAppSelector } from '../../../../../store/hooks';
import { selectMovedPointId } from '../../../selectors';
import useRoute from '../../../hooks/useRoute';
import useActionAppendPoint from './useActionAppendPoint';
import useActionDeleteLastPoint from './useActionDeleteLastPoint';
import useActionHitState from './useActionHitState';
import useActionCutSegment from './useActionCutSegment';
import useActionMovePoint from './useActionMovePoint';
import useActionDropPoint from './useActionDropPoint';
import useActionDeletePointAtCenter from './useActionDeletePointAtCenter';

const useActions = ({ points, routeId }: { points?: RoutingPoint[]; routeId?: number }) => {
	const movedPointId = useAppSelector(selectMovedPointId);
	const route = useRoute(['profile']);
	const routeProfile = route?.profile;

	const actionAppendPoint = useActionAppendPoint({ points, routeId });
	const actionDeleteLastPoint = useActionDeleteLastPoint({ points, routeId });
	const { hitState, getHits } = useActionHitState({ points, routeProfile });
	const actionCutSegment = useActionCutSegment({
		points,
		routeId,
		hitState,
		getHits,
		movedPointId,
	});
	const actionMovePoint = useActionMovePoint({ points, hitState, getHits, movedPointId });
	const actionDropPoint = useActionDropPoint({ points, routeId, movedPointId });
	const actionDeletePointAtCenter = useActionDeletePointAtCenter({
		points,
		routeId,
		hitState,
		getHits,
	});

	return useMemo(() => {
		const actions: Record<string, MenuActionOption> = {};

		actions[actionAppendPoint.key] = actionAppendPoint;
		actions[actionDeleteLastPoint.key] = actionDeleteLastPoint;
		actions[actionCutSegment.key] = actionCutSegment;
		actions[actionMovePoint.key] = actionMovePoint;
		actions[actionDropPoint.key] = actionDropPoint;
		actions[actionDeletePointAtCenter.key] = actionDeletePointAtCenter;

		return actions;
	}, [
		actionAppendPoint,
		actionDeleteLastPoint,
		actionCutSegment,
		actionMovePoint,
		actionDropPoint,
		actionDeletePointAtCenter,
	]);
};

export default useActions;
