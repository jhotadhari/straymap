/**
 * External dependencies
 */
import { useContext, useCallback, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sprintf } from 'sprintf-js';

/**
 * Internal dependencies
 */
import { FooterContext } from '../Context';
import { lineRemoveTag } from '../../../db/actionsLine';
import ModalWrapper from '../../../../../components/generic/wrapper/ModalWrapper';
import ButtonHighlight from '../../../../../components/generic/primitives/ButtonHighlight';
import { useButtonProps } from '../../../../../compose/useButtonProps';
import LoadingIndicator from '../../../../../components/generic/primitives/LoadingIndicator';
import RadioListItem from '../../../../../components/generic/wrapper/RadioListItem';
import { Tag } from '../../../types';
import TagBadge from '../../TagBadge';
import { queryAllTags, invalidateTagsTable, invalidateLinesQueries } from '../../../db/queryFns';
import { logError } from '../../../../../lib/utils';
import { featureRegistry } from '../../../../FeatureRegistry';
import { ErrorToastContext } from '../../../../../components/ErrorToast/Context';

const removeStyles = StyleSheet.create({
	modalInner: { gap: 12, marginTop: 16 },
});

const useRemoveTag = () => {
	const { t } = useTranslation();

	const { showError } = useContext(ErrorToastContext);
	const { checkedIds } = useContext(FooterContext);
	const queryClient = useQueryClient();

	const [modalVisible, setModalVisible] = useState(false);
	const [tags, setTags] = useState<Tag[]>([]);
	const [loading, setLoading] = useState(false);
	const [selectedTagId, setSelectedTagId] = useState<number | null>(null);

	const mutation = useMutation({
		mutationFn: async (tagId: number) => {
			for (const lineId of checkedIds) {
				await lineRemoveTag(lineId, tagId);
			}
		},
		onSuccess: async () => {
			await invalidateLinesQueries(queryClient);
			invalidateTagsTable(queryClient);
			setModalVisible(false);
		},
		onError: (err) => {
			logError('useRemoveTag', err);
			showError(sprintf(t('errorGeneric'), err instanceof Error ? err.message : String(err)));
		},
	});

	const buttonPropsDelete = useButtonProps({
		isDestructive: true,
		disabled: selectedTagId === null || mutation.isPending,
	});

	const openModal = useCallback(async () => {
		setLoading(true);
		setSelectedTagId(null);
		try {
			const result = await queryAllTags();
			setTags(result);
		} catch (err) {
			logError('useRemoveTag.openModal', err);
			showError(sprintf(t('errorGeneric'), err instanceof Error ? err.message : String(err)));
		} finally {
			setLoading(false);
			setModalVisible(true);
		}
	}, [showError, t]);

	const closeModal = useCallback(() => {
		if (mutation.isPending) return;
		setModalVisible(false);
	}, [mutation.isPending]);

	const handleApply = useCallback(() => {
		if (selectedTagId === null || mutation.isPending) return;
		mutation.mutate(selectedTagId);
	}, [selectedTagId, mutation]);

	const disabled = useCallback(() => checkedIds.length === 0, [checkedIds]);

	const modalNode = useMemo(
		() => (
			<ModalWrapper
				visible={modalVisible}
				onDismiss={closeModal}
				headerLabel={t('lines.removeTag')}
				innerStyle={removeStyles.modalInner}
			>
				{loading ? (
					<LoadingIndicator />
				) : tags.length === 0 ? (
					<Text>{t('lines.tagsNoTags')}</Text>
				) : (
					tags.map((tag) => {
						const isSystemTag = featureRegistry
							.getSystemTagLabels()
							.includes(tag.label ?? '');
						return (
							<RadioListItem
								key={tag.id}
								opt={{ key: String(tag.id), label: tag.label ?? '' }}
								onPress={() => setSelectedTagId(tag.id)}
								status={selectedTagId === tag.id ? 'checked' : 'unchecked'}
								labelNode={<TagBadge tag={tag} />}
								disabled={isSystemTag}
							/>
						);
					})
				)}
				<ButtonHighlight
					onPress={handleApply}
					{...buttonPropsDelete}
				>
					{t('lines.removeTagFromRoutes')}
				</ButtonHighlight>
			</ModalWrapper>
		),
		[
			modalVisible,
			closeModal,
			loading,
			tags,
			selectedTagId,
			handleApply,
			t,
			buttonPropsDelete,
		]
	);

	return useMemo(
		() => ({
			key: 'removeTag',
			cb: openModal,
			label: 'lines.removeTag',
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
