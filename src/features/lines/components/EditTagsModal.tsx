/**
 * External dependencies
 */
import { FC, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { sprintf } from 'sprintf-js';

/**
 * Internal dependencies
 */
import ModalWrapper from '../../../components/generic/wrapper/ModalWrapper';
import LoadingIndicator from '../../../components/generic/primitives/LoadingIndicator';
import ToggleRowControl from '../../../components/generic/controls/ToggleRowControl';
import ButtonHighlight from '../../../components/generic/primitives/ButtonHighlight';
import { useButtonProps } from '../../../compose/useButtonProps';
import TagBadge from './TagBadge';
import CreateTagModal from './CreateTagModal';
import { queryAllTags, invalidateTagsTable } from '../db/queryFns';
import { featureRegistry } from '../../FeatureRegistry';
import { logError } from '../../../lib/utils';
import { ErrorToastContext } from '../../../components/ErrorToast/Context';
import { Tag } from '../types';

export interface EditTagsModalProps {
	visible: boolean;
	onDismiss: () => void;
	onApply: (checkedTagIds: Set<number>) => void;
	isApplying: boolean;
	checkedTagIds: Set<number>;
}

const EditTagsModal: FC<EditTagsModalProps> = ({
	visible,
	onDismiss,
	onApply,
	isApplying,
	checkedTagIds,
}) => {
	const { t } = useTranslation();
	const { showError } = useContext(ErrorToastContext);
	const queryClient = useQueryClient();

	const [allTags, setAllTags] = useState<Tag[]>([]);
	const [loadingTags, setLoadingTags] = useState(false);
	const [selectedTagIds, setSelectedTagIds] = useState<Set<number>>(new Set());
	const [createModalVisible, setCreateModalVisible] = useState(false);

	const systemTagLabels = useMemo(() => featureRegistry.getSystemTagLabels(), []);

	const buttonProps = useButtonProps({});

	const refreshAvailableTags = useCallback(async () => {
		const result = await queryAllTags();
		setAllTags(result);
	}, []);

	const loadTags = useCallback(async () => {
		setLoadingTags(true);
		setSelectedTagIds(new Set(checkedTagIds));
		try {
			await refreshAvailableTags();
		} catch (err) {
			logError('EditTagsModal.loadTags', err);
			showError(sprintf(t('errorGeneric'), err instanceof Error ? err.message : String(err)));
		} finally {
			setLoadingTags(false);
		}
	}, [
		checkedTagIds,
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
			if (next.has(tagId)) {
				next.delete(tagId);
			} else {
				next.add(tagId);
			}
			return next;
		});
	}, []);

	const handleDismiss = useCallback(() => {
		if (isApplying) return;
		onApply(selectedTagIds);
		onDismiss();
	}, [
		isApplying,
		selectedTagIds,
		onApply,
		onDismiss,
	]);

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
				onDismiss={handleDismiss}
				headerLabel={t('lines.editTags')}
				innerStyle={styles.modalInner}
			>
				<ButtonHighlight
					{...buttonProps}
					icon="tag-plus-outline"
					onPress={() => setCreateModalVisible(true)}
				>
					{t('lines.tagsCreate')}
				</ButtonHighlight>

				{loadingTags ? (
					<LoadingIndicator />
				) : allTags.length === 0 ? (
					<Text>{t('lines.tagsNoTags')}</Text>
				) : (
					allTags.map((tag) => {
						const isSystemTag = systemTagLabels.includes(tag.label ?? '');
						return (
							<ToggleRowControl
								key={tag.id}
								label={tag.label ?? ''}
								labelNode={<TagBadge tag={tag} />}
								value={selectedTagIds.has(tag.id)}
								onToggle={isSystemTag ? () => {} : () => handleToggleTag(tag.id)}
								disabled={isSystemTag}
							/>
						);
					})
				)}
			</ModalWrapper>
			<CreateTagModal
				visible={createModalVisible}
				onDismiss={() => setCreateModalVisible(false)}
				onCreated={handleTagCreated}
			/>
		</>
	);
};

const styles = StyleSheet.create({
	modalInner: { gap: 20, marginTop: 16 },
});

export default EditTagsModal;
