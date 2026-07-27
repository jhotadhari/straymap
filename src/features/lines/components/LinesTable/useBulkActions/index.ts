/**
 * External dependencies
 */
import { useMemo } from 'react';

/**
 * Internal dependencies
 */
import { MenuActionOption } from '../../../../../types';
import useAddToMap from './useAddToMap';
import useExport from './useExport';
import useRemoveFromMap from './useRemoveFromMap';
import useShowStats from './useShowStats';
import useFlyTo from './useFlyTo';
import useAddTag from './useAddTag';
import useRemoveTag from './useRemoveTag';
import useDeleteLines from './useDeleteLines';
import useApplyDem from './useApplyDem';

const useBulkActions = () => {
	const actionShowOnMap = useAddToMap();
	const actionRemoveFromMap = useRemoveFromMap();
	const actionFlyTo = useFlyTo();
	const actionShowStats = useShowStats();
	const actionExport = useExport();
	const actionAddTag = useAddTag();
	const actionRemoveTag = useRemoveTag();
	const actionDeleteLine = useDeleteLines();
	const actionApplyDem = useApplyDem();

	return useMemo(() => {
		const actions: Record<string, MenuActionOption> = {};

		actions[actionShowOnMap.key] = actionShowOnMap;
		actions[actionRemoveFromMap.key] = actionRemoveFromMap;
		actions[actionFlyTo.key] = actionFlyTo;
		actions[actionShowStats.key] = actionShowStats;
		actions[actionExport.key] = actionExport;
		actions[actionAddTag.key] = actionAddTag;
		actions[actionRemoveTag.key] = actionRemoveTag;
		actions[actionDeleteLine.key] = actionDeleteLine;
		actions[actionApplyDem.key] = actionApplyDem;

		return actions;
	}, [
		actionShowOnMap,
		actionRemoveFromMap,
		actionFlyTo,
		actionShowStats,
		actionExport,
		actionAddTag,
		actionRemoveTag,
		actionDeleteLine,
		actionApplyDem,
	]);
};

export default useBulkActions;
