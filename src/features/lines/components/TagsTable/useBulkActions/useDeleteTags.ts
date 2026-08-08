/**
 * External dependencies
 */
import { useContext, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Internal dependencies
 */
import { FooterContext } from '../Context';
import useDeleteTagsCbModal from '../../../hooks/useDeleteTagsCbModal';
import { invalidateTagsTable, invalidateLinesQueries } from '../../../db/queryFns';

const useDeleteTags = () => {
	const { checkedIds, setCheckedIds } = useContext(FooterContext);
	const queryClient = useQueryClient();

	const onSuccess = useCallback(() => {
		invalidateTagsTable(queryClient);
		queryClient.invalidateQueries({ queryKey: ['tags'] });
		invalidateLinesQueries(queryClient);
		setCheckedIds?.([]);
	}, [queryClient, setCheckedIds]);

	const disabled = useCallback(() => checkedIds.length === 0, [checkedIds]);

	const { cb, modalNode } = useDeleteTagsCbModal({
		deleteIds: checkedIds,
		onSuccess,
	});

	return useMemo(
		() => ({
			key: 'deleteTags',
			cb,
			label: 'lines.delete',
			leadingIcon: 'delete-outline',
			modalNode,
			disabled,
		}),
		[
			cb,
			modalNode,
			disabled,
		]
	);
};

export default useDeleteTags;
