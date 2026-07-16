/**
 * External dependencies
 */
import { FC, useCallback, useContext, useMemo, useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sprintf } from 'sprintf-js';

/**
 * Internal dependencies
 */
import { LineEditModalContext } from './Context';
import InfoLabelRow from '../../../../components/generic/infoWrapper/InfoLabelRow';
import TagBadge from '../TagBadge';
import IconButtonHighlight from '../../../../components/generic/primitives/IconButtonHighlight';
import AddTagsModal from '../AddTagsModal';
import { lineAddTag, lineRemoveTag } from '../../db/actionsLine';
import { invalidateTagsTable, invalidateLinesQueries } from '../../db/queryFns';
import { featureRegistry } from '../../../FeatureRegistry';
import { logError } from '../../../../lib/utils';
import { ErrorToastContext } from '../../../../components/ErrorToast/Context';

const RowTags: FC = () => {
	const { t } = useTranslation();
	const theme = useTheme();
	const { showError } = useContext(ErrorToastContext);
	const queryClient = useQueryClient();

	const { line } = useContext(LineEditModalContext);

	const tags = line?.tags ?? [];
	const lineTagIds = useMemo(() => new Set(tags.map((t) => t.id)), [tags]);

	const systemTagLabels = useMemo(() => featureRegistry.getSystemTagLabels(), []);

	const removeMutation = useMutation({
		mutationFn: async ({ tagId }: { tagId: number }) => {
			if (!line?.id) return;
			await lineRemoveTag(line.id, tagId);
		},
		onSuccess: async () => {
			await invalidateLinesQueries(queryClient);
			invalidateTagsTable(queryClient);
		},
		onError: (err) => {
			logError('RowTags.removeTag', err);
			showError(sprintf(t('errorGeneric'), err instanceof Error ? err.message : String(err)));
		},
	});

	const handleRemoveTag = useCallback(
		(tagId: number) => {
			if (!line?.id || removeMutation.isPending) return;
			removeMutation.mutate({ tagId });
		},
		[line?.id, removeMutation]
	);

	// ── add-tag modal ──────────────────────────────────────────────

	const [addModalVisible, setAddModalVisible] = useState(false);

	const addMutation = useMutation({
		mutationFn: async (tagId: number) => {
			if (!line?.id) return;
			await lineAddTag(line.id, tagId);
		},
		onSuccess: async () => {
			await invalidateLinesQueries(queryClient);
			invalidateTagsTable(queryClient);
			setAddModalVisible(false);
		},
		onError: (err) => {
			logError('RowTags.addTag', err);
			showError(sprintf(t('errorGeneric'), err instanceof Error ? err.message : String(err)));
		},
	});

	const handleAddApply = useCallback(
		(tagId: number) => {
			addMutation.mutate(tagId);
		},
		[addMutation]
	);

	// ── render ─────────────────────────────────────────────────────

	return (
		<InfoLabelRow
			label={t('lines.columns.tags')}
			Info={t('lines.hintTags')}
			style={{ alignItems: 'flex-start' }}
		>
			<AddTagsModal
				visible={addModalVisible}
				onDismiss={() => setAddModalVisible(false)}
				onApply={handleAddApply}
				isApplying={addMutation.isPending}
				excludeTagIds={lineTagIds}
			/>
			<View
				style={{
					flexDirection: 'row',
					flexWrap: 'wrap',
					gap: 4,
					alignItems: 'center',
				}}
			>
				{tags.length === 0 ? (
					<Text style={{ opacity: 0.5 }}>{t('lines.tagsNoTags')}</Text>
				) : (
					tags.map((tag) => {
						const isSystemTag = systemTagLabels.includes(tag.label ?? '');
						return (
							<TouchableOpacity
								key={tag.id}
								onPress={() => !isSystemTag && handleRemoveTag(tag.id)}
								disabled={isSystemTag || removeMutation.isPending}
							>
								<View
									style={{
										flexDirection: 'row',
										alignItems: 'center',
										gap: 2,
									}}
								>
									<TagBadge tag={tag} />
									{isSystemTag && (
										<Icon
											source="lock-outline"
											size={12}
											color={theme.colors.onSurfaceDisabled}
										/>
									)}
								</View>
							</TouchableOpacity>
						);
					})
				)}
				<IconButtonHighlight
					icon="plus"
					size={18}
					onPress={() => setAddModalVisible(true)}
				/>
			</View>
		</InfoLabelRow>
	);
};

export default RowTags;
