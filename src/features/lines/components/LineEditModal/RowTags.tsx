/**
 * External dependencies
 */
import { FC, useCallback, useContext, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
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
import EditTagsModal from '../EditTagsModal';
import { lineAddTag, lineRemoveTag } from '../../db/actionsLine';
import { invalidateTagsTable, invalidateLinesQueries } from '../../db/queryFns';
import { featureRegistry } from '../../../FeatureRegistry';
import { logError } from '../../../../lib/utils';
import { ErrorToastContext } from '../../../../components/ErrorToast/Context';
import { sharedStyles } from '../../../../sharedStyles';

const RowTags: FC = () => {
	const { t } = useTranslation();
	const theme = useTheme();
	const { showError } = useContext(ErrorToastContext);
	const queryClient = useQueryClient();

	const { line } = useContext(LineEditModalContext);

	const tags = useMemo(() => line?.tags ?? [], [line?.tags]);
	const lineTagIds = useMemo(() => new Set(tags.map((t) => t.id)), [tags]);

	const systemTagLabels = useMemo(() => featureRegistry.getSystemTagLabels(), []);

	// ── edit-tags modal ────────────────────────────────────────────

	const [editModalVisible, setEditModalVisible] = useState(false);

	const editMutation = useMutation({
		mutationFn: async (vars: { toAdd: number[]; toRemove: number[] }) => {
			if (!line?.id) return;
			for (const tagId of vars.toRemove) {
				await lineRemoveTag(line.id, tagId);
			}
			for (const tagId of vars.toAdd) {
				await lineAddTag(line.id, tagId);
			}
		},
		onSuccess: async () => {
			await invalidateLinesQueries(queryClient);
			invalidateTagsTable(queryClient);
			setEditModalVisible(false);
		},
		onError: (err) => {
			logError('RowTags.editTags', err);
			showError(sprintf(t('errorGeneric'), err instanceof Error ? err.message : String(err)));
		},
	});

	const handleEditApply = useCallback(
		(checkedTagIds: Set<number>) => {
			if (!line?.id || editMutation.isPending) return;
			const toAdd = [...checkedTagIds].filter((id) => !lineTagIds.has(id));
			const toRemove = [...lineTagIds].filter((id) => !checkedTagIds.has(id));
			if (toAdd.length === 0 && toRemove.length === 0) return;
			editMutation.mutate({ toAdd, toRemove });
		},
		[
			line?.id,
			lineTagIds,
			editMutation,
		]
	);

	// ── render ─────────────────────────────────────────────────────

	return (
		<InfoLabelRow
			label={t('lines.columns.tags')}
			Info={t('lines.hintTags')}
		>
			<EditTagsModal
				visible={editModalVisible}
				onDismiss={() => setEditModalVisible(false)}
				onApply={handleEditApply}
				isApplying={editMutation.isPending}
				checkedTagIds={lineTagIds}
			/>
			<View style={styles.tagsRow}>
				<View style={styles.tagsWrapper}>
					{tags.length === 0 ? (
						<Text style={styles.disabled}>{t('lines.tagsNoTags')}</Text>
					) : (
						tags.map((tag) => {
							const isSystemTag = systemTagLabels.includes(tag.label ?? '');
							return (
								<View
									key={tag.id}
									style={styles.tagRow}
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
							);
						})
					)}
				</View>
				<IconButtonHighlight
					icon="tag-edit"
					size={16}
					onPress={() => setEditModalVisible(true)}
					mode="outlined"
				/>
			</View>
		</InfoLabelRow>
	);
};

const styles = StyleSheet.create({
	disabled: sharedStyles.disabled,
	tagsRow: { flexDirection: 'row', alignItems: 'center' },
	tagsWrapper: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 4, alignItems: 'center' },
	tagRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
});

export default RowTags;
