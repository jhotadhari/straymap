/**
 * External dependencies
 */
import { FC, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { sprintf } from 'sprintf-js';

/**
 * Internal dependencies
 */
import ModalWrapper from '../../../components/generic/wrapper/ModalWrapper';
import LoadingIndicator from '../../../components/generic/primitives/LoadingIndicator';
import RadioListItem from '../../../components/generic/wrapper/RadioListItem';
import TagBadge from './TagBadge';
import CreateTagModal from './CreateTagModal';
import { queryAllTags, invalidateTagsTable } from '../db/queryFns';
import { featureRegistry } from '../../FeatureRegistry';
import { logError } from '../../../lib/utils';
import { ErrorToastContext } from '../../../components/ErrorToast/Context';
import { Tag } from '../types';

export interface AddTagModalProps {
	visible: boolean;
	onDismiss: () => void;
	onApply: (selectedTagId: number) => void;
	isApplying: boolean;
	excludeTagIds?: Set<number>;
}

const AddTagModal: FC<AddTagModalProps> = ({
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
	const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
	const [createModalVisible, setCreateModalVisible] = useState(false);

	const systemTagLabels = useMemo(() => featureRegistry.getSystemTagLabels(), []);

	const refreshAvailableTags = useCallback(async () => {
		const result = await queryAllTags();
		setAllTags(result.filter((tag) => !excludeTagIds?.has(tag.id)));
	}, [excludeTagIds]);

	const loadTags = useCallback(async () => {
		setLoadingTags(true);
		setSelectedTagId(null);
		try {
			await refreshAvailableTags();
		} catch (err) {
			logError('AddTagModal.loadTags', err);
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

	const handleSelectTag = useCallback((tagId: number) => {
		setSelectedTagId(tagId);
	}, []);

	const handleDismiss = useCallback(() => {
		if (isApplying) return;
		if (selectedTagId !== null) {
			onApply(selectedTagId);
		}
		onDismiss();
	}, [
		isApplying,
		selectedTagId,
		onApply,
		onDismiss,
	]);

	const handleTagCreated = useCallback(
		async (tag: Tag) => {
			await queryClient.invalidateQueries({ queryKey: ['tags'] });
			invalidateTagsTable(queryClient);
			await refreshAvailableTags();
			setSelectedTagId(tag.id);
		},
		[queryClient, refreshAvailableTags]
	);

	return (
		<>
			<ModalWrapper
				visible={visible}
				onDismiss={handleDismiss}
				headerLabel={t('lines.addTag')}
				innerStyle={styles.modalInner}
			>
				<RadioListItem
					opt={{ key: '__create__', label: '' }}
					onPress={() => setCreateModalVisible(true)}
					status="unchecked"
					labelNode={
						<View style={styles.createTagRow}>
							<Icon
								source="tag-plus-outline"
								size={20}
							/>
							<Text>{t('lines.tagsCreate')}</Text>
						</View>
					}
				/>

				{loadingTags ? (
					<LoadingIndicator />
				) : allTags.length === 0 ? (
					<Text>{t('lines.tagsNoTags')}</Text>
				) : (
					allTags.map((tag) => {
						const isSystemTag = systemTagLabels.includes(tag.label ?? '');
						return (
							<RadioListItem
								key={tag.id}
								opt={{ key: String(tag.id), label: tag.label ?? '' }}
								onPress={() => handleSelectTag(tag.id)}
								status={selectedTagId === tag.id ? 'checked' : 'unchecked'}
								labelNode={<TagBadge tag={tag} />}
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
	modalInner: { gap: 12, marginTop: 16 },
	createTagRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});

export default AddTagModal;
