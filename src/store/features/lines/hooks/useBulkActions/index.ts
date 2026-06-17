import { MenuActionOption } from '../../../../../types';
import useAddToMap from './useAddToMap';
import useDeleteLines from './useDeleteLines';
import useRemoveFromMap from './useRemoveFromMap';

const useBulkActions = () => {
	const actions: Record<string, MenuActionOption> = {};

	const actionShowOnMap = useAddToMap();
	actions[actionShowOnMap.key] = actionShowOnMap;

	const actionRemoveFromMap = useRemoveFromMap();
	actions[actionRemoveFromMap.key] = actionRemoveFromMap;

	const actionDeleteLine = useDeleteLines();
	actions[actionDeleteLine.key] = actionDeleteLine;

	return actions;
};

export default useBulkActions;
