/**
 * External dependencies
 */
import { useMemo } from 'react';

/**
 * Internal dependencies
 */
import { MenuActionOption } from '../../../../../../types';
import useDeleteTags from './useDeleteTags';
import useChangeTagColor from './useChangeTagColor';
import useShowRoutesWithTags from './useShowRoutesWithTags';

const useTagBulkActions = () => {
	const actionDeleteTags = useDeleteTags();
	const actionChangeTagColor = useChangeTagColor();
	const actionShowRoutesWithTags = useShowRoutesWithTags();

	return useMemo(() => {
		const actions: Record<string, MenuActionOption> = {};

		actions[actionDeleteTags.key] = actionDeleteTags;
		actions[actionChangeTagColor.key] = actionChangeTagColor;
		actions[actionShowRoutesWithTags.key] = actionShowRoutesWithTags;

		return actions;
	}, [
		actionDeleteTags,
		actionChangeTagColor,
		actionShowRoutesWithTags,
	]);
};

export default useTagBulkActions;
