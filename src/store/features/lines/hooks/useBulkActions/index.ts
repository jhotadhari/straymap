import { MenuActionOption } from '../../../../../types';
import useAddToMap from './useAddToMap';
import useRemoveFromMap from './useRemoveFromMap';

const useBulkActions = () => {
	const actions: Record<string, MenuActionOption> = {};

	const actionShowOnMap = useAddToMap();
	actions[actionShowOnMap.key] = actionShowOnMap;

	const actionRemoveFromMap = useRemoveFromMap();
	actions[actionRemoveFromMap.key] = actionRemoveFromMap;

	return actions;
};

export default useBulkActions;
