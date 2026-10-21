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
import { selectGrabbedPointId } from '../../../selectors';
import useRoute from '../../../hooks/useRoute';
import useActionAppendPoint from './useActionAppendPoint';
import useActionDeleteLastPoint from './useActionDeleteLastPoint';
import useActionHitState from './useActionHitState';
import useActionCutSegment from './useActionCutSegment';
import useActionGrabPoint from './useActionGrabPoint';
import useActionDropPoint from './useActionDropPoint';
import useActionDeletePointAtCenter from './useActionDeletePointAtCenter';

const useActions = ({ points, routeId }: { points?: RoutingPoint[]; routeId?: number }) => {
	const grabbedPointId = useAppSelector(selectGrabbedPointId);
	const route = useRoute(['profile']);
	const routeProfile = route?.profile;

	const actionAppendPoint = useActionAppendPoint({ points, routeId });
	const actionDeleteLastPoint = useActionDeleteLastPoint({ points, routeId });
	const { hitState, getHits } = useActionHitState({ points, routeProfile });
	const actionCutSegment = useActionCutSegment({ points, routeId, hitState, getHits });
	const actionGrabPoint = useActionGrabPoint({ hitState, getHits, grabbedPointId });
	const actionDropPoint = useActionDropPoint({ points, routeId, grabbedPointId });
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
		actions[actionGrabPoint.key] = actionGrabPoint;
		actions[actionDropPoint.key] = actionDropPoint;
		actions[actionDeletePointAtCenter.key] = actionDeletePointAtCenter;

		return actions;
	}, [
		actionAppendPoint,
		actionDeleteLastPoint,
		actionCutSegment,
		actionGrabPoint,
		actionDropPoint,
		actionDeletePointAtCenter,
	]);
};

export default useActions;
