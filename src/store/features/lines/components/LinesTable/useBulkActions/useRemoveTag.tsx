/**
 * External dependencies
 */
import { useContext, useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Text, Checkbox } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Internal dependencies
 */
import { FooterContext } from '../Context';
import { lineRemoveTag } from '../../../db/actionsLine';
import ModalWrapper from '../../../../../../components/generic/ModalWrapper';
import ButtonHighlight from '../../../../../../components/generic/ButtonHighlight';
import LoadingIndicator from '../../../../../../components/generic/LoadingIndicator';
import { Tag } from '../../../types';
import TagBadge from '../../TagBadge';
import { queryAllTags } from '../../../db/queryFns';
import { logError } from '../../../../../../lib/utils';
import { ErrorToastContext } from '../../../../../../components/ErrorToast/Context';
import { sprintf } from 'sprintf-js';

const useRemoveTag = () => {
	const { t } = useTranslation();
	const { showError } = useContext(ErrorToastContext);
	const { checkedIds } = useContext(FooterContext);
	const queryClient = useQueryClient();

	const [modalVisible, setModalVisible] = useState(false);
	const [tags, setTags] = useState<Tag[]>([]);
	const [loading, setLoading] = useState(false);
	const [selectedTagIds, setSelectedTagIds] = useState<Set<number>>(new Set());

	const mutation = useMutation({
		mutationFn: async () => {
			const tagIds = Array.from(selectedTagIds);
			for (const lineId of checkedIds) {
				for (const tagId of tagIds) {
					await lineRemoveTag(lineId, tagId);
				}
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['lines'] });
			setModalVisible(false);
			setSelectedTagIds(new Set());
		},
		onError: (err) => {
			logError('useRemoveTag', err);
			showError(sprintf(t('errorGeneric'), err instanceof Error ? err.message : String(err)));
		},
	});

	const openModal = useCallback(async () => {
		setLoading(true);
		setSelectedTagIds(new Set());
		try {
			const result = await queryAllTags();
			setTags(result);
			setLoading(false);
			setModalVisible(true);
		} catch (err) {
			logError('useRemoveTag.openModal', err);
			showError(sprintf(t('errorGeneric'), err instanceof Error ? err.message : String(err)));
			setLoading(false);
		}
	}, [showError, t]);

	const closeModal = useCallback(() => {
		if (mutation.isPending) return;
		setModalVisible(false);
	}, [mutation.isPending]);

	const handleToggle = useCallback((tagId: number) => {
		setSelectedTagIds((prev) => {
			const next = new Set(prev);
			if (next.has(tagId)) next.delete(tagId);
			else next.add(tagId);
			return next;
		});
	}, []);

	const handleApply = useCallback(() => {
		if (!selectedTagIds.size) return;
		mutation.mutate();
	}, [selectedTagIds, mutation]);

	const disabled = useCallback(() => checkedIds.length === 0, [checkedIds]);

	const modalNode = useMemo(
		() => (
			<ModalWrapper
				visible={modalVisible}
				onDismiss={closeModal}
				header={t('lines.removeTags')}
				innerStyle={{ gap: 12, marginTop: 16 }}
			>
				{loading ? (
					<LoadingIndicator />
				) : tags.length === 0 ? (
					<Text>{t('lines.tagsNoTags')}</Text>
				) : (
					tags.map((tag) => (
						<View
							key={tag.id}
							style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
						>
							<Checkbox
								status={selectedTagIds.has(tag.id) ? 'checked' : 'unchecked'}
								onPress={() => handleToggle(tag.id)}
							/>
							<TagBadge tag={tag} />
						</View>
					))
				)}
				<ButtonHighlight
					onPress={handleApply}
					mode="contained"
					disabled={!selectedTagIds.size || mutation.isPending}
				>
					<Text>{t('lines.tagsApply')}</Text>
				</ButtonHighlight>
			</ModalWrapper>
		),
		[
			modalVisible,
			closeModal,
			loading,
			tags,
			selectedTagIds,
			handleToggle,
			handleApply,
			mutation.isPending,
			t,
		]
	);

	return useMemo(
		() => ({
			key: 'removeTags',
			cb: openModal,
			label: 'removeTags',
			leadingIcon: 'tag-minus-outline',
			modalNode,
			disabled,
		}),
		[
			openModal,
			modalNode,
			disabled,
		]
	);
};

export default useRemoveTag;
