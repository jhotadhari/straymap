/**
 * External dependencies
 */
import { useMemo } from 'react';

/**
 * Internal dependencies
 */
import { MenuActionOption } from '../../../../../../types';
import useAddToMap from './useAddToMap';
import useDeleteLines from './useDeleteLines';
import useRemoveFromMap from './useRemoveFromMap';
import useShowStats from './useShowStats';
import useFlyTo from './useFlyTo';

const useBulkActions = () => {
	const actionShowOnMap = useAddToMap();
	const actionRemoveFromMap = useRemoveFromMap();
	const actionFlyTo = useFlyTo();
	const actionShowStats = useShowStats();
	const actionDeleteLine = useDeleteLines();

	return useMemo(() => {
		const actions: Record<string, MenuActionOption> = {};

		actions[actionShowOnMap.key] = actionShowOnMap;
		actions[actionRemoveFromMap.key] = actionRemoveFromMap;
		actions[actionFlyTo.key] = actionFlyTo;
		actions[actionShowStats.key] = actionShowStats;
		actions[actionDeleteLine.key] = actionDeleteLine;

		return actions;
	}, [
		actionShowOnMap,
		actionRemoveFromMap,
		actionFlyTo,
		actionShowStats,
		actionDeleteLine,
	]);
};

export default useBulkActions;
