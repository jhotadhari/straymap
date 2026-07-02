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
import useExport from './useExport';
import useRemoveFromMap from './useRemoveFromMap';
import useShowStats from './useShowStats';
import useFlyTo from './useFlyTo';
import useAddTag from './useAddTag';
import useRemoveTag from './useRemoveTag';

const useBulkActions = () => {
	const actionShowOnMap = useAddToMap();
	const actionRemoveFromMap = useRemoveFromMap();
	const actionFlyTo = useFlyTo();
	const actionShowStats = useShowStats();
	const actionDeleteLine = useDeleteLines();
	const actionExport = useExport();
	const actionAddTag = useAddTag();
	const actionRemoveTag = useRemoveTag();

	return useMemo(() => {
		const actions: Record<string, MenuActionOption> = {};

		actions[actionShowOnMap.key] = actionShowOnMap;
		actions[actionRemoveFromMap.key] = actionRemoveFromMap;
		actions[actionFlyTo.key] = actionFlyTo;
		actions[actionShowStats.key] = actionShowStats;
		actions[actionDeleteLine.key] = actionDeleteLine;
		actions[actionExport.key] = actionExport;
		actions[actionAddTag.key] = actionAddTag;
		actions[actionRemoveTag.key] = actionRemoveTag;

		return actions;
	}, [
		actionShowOnMap,
		actionRemoveFromMap,
		actionFlyTo,
		actionShowStats,
		actionDeleteLine,
		actionExport,
		actionAddTag,
		actionRemoveTag,
	]);
};

export default useBulkActions;
