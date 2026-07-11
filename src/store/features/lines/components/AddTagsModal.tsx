/**
 * External dependencies
 */
import { FC, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { Text, Checkbox } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { sprintf } from 'sprintf-js';

/**
 * Internal dependencies
 */
import ModalWrapper from '../../../../components/generic/ModalWrapper';
import ButtonHighlight from '../../../../components/generic/ButtonHighlight';
import LoadingIndicator from '../../../../components/generic/LoadingIndicator';
import TagBadge from './TagBadge';
import CreateTagModal from './CreateTagModal';
import { queryAllTags, invalidateTagsTable } from '../db/queryFns';
import { featureRegistry } from '../../FeatureRegistry';
import { logError } from '../../../../lib/utils';
import { ErrorToastContext } from '../../../../components/ErrorToast/Context';
import { Tag } from '../types';

export interface AddTagsModalProps {
	visible: boolean;
	onDismiss: () => void;
	onApply: (selectedTagIds: number[]) => void;
	isApplying: boolean;
	excludeTagIds?: Set<number>;
}

const AddTagsModal: FC<AddTagsModalProps> = ({
	visible,
	onDismiss,
	onApply,
	isApplying,
	excludeTagIds,
}) => {
	const { t } = useTranslation();
	const { showError } = useContext(ErrorToastContext);
	const queryClient = useQueryClient();

	const [allTags, setAllTags] = useState<Tag[]>([]);
	const [loadingTags, setLoadingTags] = useState(false);
	const [selectedTagIds, setSelectedTagIds] = useState<Set<number>>(new Set());
	const [createModalVisible, setCreateModalVisible] = useState(false);

	const systemTagLabels = useMemo(() => featureRegistry.getSystemTagLabels(), []);

	const refreshAvailableTags = useCallback(async () => {
		const result = await queryAllTags();
		setAllTags(
			result.filter(
				(tag) => !systemTagLabels.includes(tag.label ?? '') && !excludeTagIds?.has(tag.id)
			)
		);
	}, [systemTagLabels, excludeTagIds]);

	const loadTags = useCallback(async () => {
		setLoadingTags(true);
		setSelectedTagIds(new Set());
		try {
			await refreshAvailableTags();
		} catch (err) {
			logError('AddTagsModal.loadTags', err);
			showError(sprintf(t('errorGeneric'), err instanceof Error ? err.message : String(err)));
		} finally {
			setLoadingTags(false);
		}
	}, [
		refreshAvailableTags,
		showError,
		t,
	]);

	// Load tags when modal becomes visible.
	const prevVisibleRef = useRef(false);
	useEffect(() => {
		if (visible && !prevVisibleRef.current) {
			loadTags();
		}
		prevVisibleRef.current = visible;
	}, [visible, loadTags]);

	const handleToggleTag = useCallback((tagId: number) => {
		setSelectedTagIds((prev) => {
			const next = new Set(prev);
			if (next.has(tagId)) next.delete(tagId);
			else next.add(tagId);
			return next;
		});
	}, []);

	const handleApply = useCallback(() => {
		if (!selectedTagIds.size) return;
		onApply(Array.from(selectedTagIds));
	}, [selectedTagIds, onApply]);

	const handleTagCreated = useCallback(
		async (tag: Tag) => {
			await queryClient.invalidateQueries({ queryKey: ['tags'] });
			invalidateTagsTable(queryClient);
			await refreshAvailableTags();
			setSelectedTagIds((prev) => new Set(prev).add(tag.id));
		},
		[queryClient, refreshAvailableTags]
	);

	return (
		<>
			<ModalWrapper
				visible={visible}
				onDismiss={onDismiss}
				header={t('lines.addTags')}
				innerStyle={{ gap: 12, marginTop: 16 }}
			>
				<ButtonHighlight
					mode="text"
					compact
					onPress={() => setCreateModalVisible(true)}
					icon="tag-plus-outline"
				>
					<Text>{t('lines.tagsCreate')}</Text>
				</ButtonHighlight>

				{loadingTags ? (
					<LoadingIndicator />
				) : allTags.length === 0 ? (
					<Text>{t('lines.tagsNoTags')}</Text>
				) : (
					allTags.map((tag) => (
						<View
							key={tag.id}
							style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
						>
							<Checkbox
								status={selectedTagIds.has(tag.id) ? 'checked' : 'unchecked'}
								onPress={() => handleToggleTag(tag.id)}
							/>
							<TagBadge tag={tag} />
						</View>
					))
				)}
				<ButtonHighlight
					onPress={handleApply}
					mode="contained"
					disabled={!selectedTagIds.size || isApplying}
				>
					<Text>{t('lines.tagsApply')}</Text>
				</ButtonHighlight>
			</ModalWrapper>
			<CreateTagModal
				visible={createModalVisible}
				onDismiss={() => setCreateModalVisible(false)}
				onCreated={handleTagCreated}
			/>
		</>
	);
};

export default AddTagsModal;
