/**
 * External dependencies
 */
import { useContext, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sprintf } from 'sprintf-js';

/**
 * Internal dependencies
 */
import { FooterContext } from '../Context';
import { lineAddTag } from '../../../db/actionsLine';
import AddTagsModal from '../../AddTagsModal';
import { invalidateTagsTable } from '../../../db/queryFns';
import { logError } from '../../../../../../lib/utils';
import { ErrorToastContext } from '../../../../../../components/ErrorToast/Context';

const useAddTag = () => {
	const { t } = useTranslation();
	const { showError } = useContext(ErrorToastContext);
	const { checkedIds } = useContext(FooterContext);
	const queryClient = useQueryClient();

	const [modalVisible, setModalVisible] = useState(false);

	const mutation = useMutation({
		mutationFn: async (tagIds: number[]) => {
			for (const lineId of checkedIds) {
				for (const tagId of tagIds) {
					await lineAddTag(lineId, tagId);
				}
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['lines'] });
			invalidateTagsTable(queryClient);
			setModalVisible(false);
		},
		onError: (err) => {
			logError('useAddTag', err);
			showError(sprintf(t('errorGeneric'), err instanceof Error ? err.message : String(err)));
		},
	});

	const handleApply = useCallback(
		(tagIds: number[]) => {
			if (!tagIds.length) return;
			mutation.mutate(tagIds);
		},
		[mutation]
	);

	const disabled = useCallback(() => checkedIds.length === 0, [checkedIds]);

	const modalNode = useMemo(
		() => (
			<AddTagsModal
				visible={modalVisible}
				onDismiss={() => setModalVisible(false)}
				onApply={handleApply}
				isApplying={mutation.isPending}
			/>
		),
		[
			modalVisible,
			handleApply,
			mutation.isPending,
		]
	);

	return useMemo(
		() => ({
			key: 'addTags',
			cb: () => setModalVisible(true),
			label: 'addTags',
			leadingIcon: 'tag-plus-outline',
			modalNode,
			disabled,
		}),
		[modalNode, disabled]
	);
};

export default useAddTag;
