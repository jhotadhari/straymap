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

const useTagBulkActions = () => {
	const actionDeleteTags = useDeleteTags();
	const actionChangeTagColor = useChangeTagColor();

	return useMemo(() => {
		const actions: Record<string, MenuActionOption> = {};

		actions[actionDeleteTags.key] = actionDeleteTags;
		actions[actionChangeTagColor.key] = actionChangeTagColor;

		return actions;
	}, [actionDeleteTags, actionChangeTagColor]);
};

export default useTagBulkActions;
