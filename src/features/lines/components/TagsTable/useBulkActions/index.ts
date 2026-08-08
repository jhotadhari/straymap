/**
 * External dependencies
 */
import { useMemo } from 'react';

/**
 * Internal dependencies
 */
import { MenuActionOption } from '../../../../../types';
import useChangeTagColor from './useChangeTagColor';
import useShowRoutesWithTags from './useShowRoutesWithTags';
import useDeleteTags from './useDeleteTags';

const useTagBulkActions = () => {
	const actionChangeTagColor = useChangeTagColor();
	const actionShowRoutesWithTags = useShowRoutesWithTags();
	const actionDeleteTags = useDeleteTags();

	return useMemo(() => {
		const actions: Record<string, MenuActionOption> = {};

		actions[actionChangeTagColor.key] = actionChangeTagColor;
		actions[actionShowRoutesWithTags.key] = actionShowRoutesWithTags;
		actions[actionDeleteTags.key] = actionDeleteTags;

		return actions;
	}, [
		actionChangeTagColor,
		actionShowRoutesWithTags,
		actionDeleteTags,
	]);
};

export default useTagBulkActions;
