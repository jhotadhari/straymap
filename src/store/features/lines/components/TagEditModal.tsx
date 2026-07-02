/**
 * External dependencies
 */
import { FC, useCallback, useContext, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, TextInput, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { get } from 'lodash-es';
import { sprintf } from 'sprintf-js';

/**
 * Internal dependencies
 */
import { ErrorToastContext } from '../../../../components/ErrorToast/Context';
import { logError } from '../../../../lib/utils';
import ButtonHighlight from '../../../../components/generic/ButtonHighlight';
import ModalWrapper from '../../../../components/generic/ModalWrapper';
import LoadingIndicator from '../../../../components/generic/LoadingIndicator';
import { queryAllTags } from '../db/queryFns';
import { createTags, updateTag, deleteTag } from '../db/actionsTag';
import { Tag } from '../types';
import { TAG_COLORS, getTagColor } from './tagColor';
import TagBadge from './TagBadge';

const ColorPalette: FC<{
	selectedColor: string;
	onSelect: (color: string) => void;
}> = ({ selectedColor, onSelect }) => (
	<View style={styles.colorRow}>
		{TAG_COLORS.map((tc) => (
			<ButtonHighlight
				key={tc.bg}
				mode="text"
				compact
				onPress={() => onSelect(tc.bg)}
				style={[
					styles.colorSwatch,
					{
						backgroundColor: tc.bg,
						borderColor: tc.border,
					},
					selectedColor === tc.bg && styles.colorSwatchSelected,
				]}
			>
				<Text> </Text>
			</ButtonHighlight>
		))}
	</View>
);

const TagEditModal: FC<{
	visible: boolean;
	onDismiss: () => void;
}> = ({ visible, onDismiss }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { showError } = useContext(ErrorToastContext);
	const queryClient = useQueryClient();

	const { data: tags, isLoading } = useQuery({
		queryKey: ['tags'],
		queryFn: queryAllTags,
		enabled: visible,
		staleTime: 0,
	});

	const [newLabel, setNewLabel] = useState('');
	const [newColor, setNewColor] = useState(TAG_COLORS[0].bg);

	const createMutation = useMutation({
		mutationFn: async () => {
			if (!newLabel.trim()) return;
			await createTags([{ label: newLabel.trim(), notes: null, data: { color: newColor } }]);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['tags'] });
			setNewLabel('');
		},
		onError: (err) => {
			logError('TagEditModal.createTag', err);
			showError(sprintf(t('errorGeneric'), err instanceof Error ? err.message : String(err)));
		},
	});

	const updateMutation = useMutation({
		mutationFn: async ({ id, label, color }: { id: number; label?: string; color?: string }) => {
			await updateTag(id, {
				...(label !== undefined && { label }),
				...(color !== undefined && { data: { color } }),
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['tags'] });
			queryClient.invalidateQueries({ queryKey: ['lines'] });
		},
		onError: (err) => {
			logError('TagEditModal.updateTag', err);
			showError(sprintf(t('errorGeneric'), err instanceof Error ? err.message : String(err)));
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (id: number) => {
			await deleteTag(id);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['tags'] });
			queryClient.invalidateQueries({ queryKey: ['lines'] });
		},
		onError: (err) => {
			logError('TagEditModal.deleteTag', err);
			showError(sprintf(t('errorGeneric'), err instanceof Error ? err.message : String(err)));
		},
	});

	const handleCreate = useCallback(() => {
		if (!newLabel.trim()) return;
		createMutation.mutate();
	}, [newLabel, createMutation]);

	const handleDelete = useCallback(
		(id: number) => {
			deleteMutation.mutate(id);
		},
		[deleteMutation]
	);

	const handleColorChange = useCallback(
		(tag: Tag, color: string) => {
			updateMutation.mutate({ id: tag.id, color });
		},
		[updateMutation]
	);

	const selectionCount = useMemo(() => {
		const c = TAG_COLORS.find((tc) => tc.bg === newColor);
		return c ? c.bg : TAG_COLORS[0].bg;
	}, [newColor]);

	return (
		<ModalWrapper
			visible={visible}
			onDismiss={onDismiss}
			header={t('lines.tagsEditTitle')}
			innerStyle={styles.modalInner}
		>
			{isLoading && (
				<View style={styles.centered}>
					<LoadingIndicator />
				</View>
			)}

			{!isLoading && (
				<ScrollView horizontal={false}>
					{/* Existing tags */}
					{(tags ?? []).map((tag) => {
						const color = getTagColor(tag);
						return (
							<View key={tag.id} style={[styles.tagRow, { borderColor: theme.colors.outline }]}>
								<TagBadge tag={tag} />
								<Text style={styles.tagLabel}>{tag.label}</Text>
								{/* Inline palette for this tag */}
								<ColorPalette
									selectedColor={color.bg}
									onSelect={(c) => handleColorChange(tag, c)}
								/>
								<ButtonHighlight
									mode="text"
									compact
									onPress={() => handleDelete(tag.id)}
								>
									<Text style={{ color: theme.colors.error }}>
										{t('lines.delete')}
									</Text>
								</ButtonHighlight>
							</View>
						);
					})}

					{/* Create new tag */}
					<View style={[styles.newTagRow, { borderColor: theme.colors.outline }]}>
						<TextInput
							value={newLabel}
							onChangeText={setNewLabel}
							placeholder={t('lines.tagsNewPlaceholder')}
							style={styles.input}
							mode="outlined"
							dense
						/>
						<ColorPalette
							selectedColor={selectionCount}
							onSelect={setNewColor}
						/>
						<ButtonHighlight
							onPress={handleCreate}
							mode="contained"
							disabled={!newLabel.trim() || createMutation.isPending}
							buttonColor={get(theme.colors, 'successContainer')}
							textColor={get(theme.colors, 'onSuccessContainer')}
						>
							<Text>{t('lines.tagsCreate')}</Text>
						</ButtonHighlight>
					</View>
				</ScrollView>
			)}
		</ModalWrapper>
	);
};

const styles = StyleSheet.create({
	modalInner: {
		gap: 12,
		marginTop: 16,
	},
	centered: {
		alignItems: 'center',
		paddingVertical: 24,
	},
	tagRow: {
		borderBottomWidth: 1,
		paddingVertical: 8,
		gap: 8,
	},
	tagLabel: {
		fontSize: 14,
		marginTop: 4,
	},
	newTagRow: {
		borderTopWidth: 1,
		paddingTop: 16,
		marginTop: 8,
		gap: 8,
	},
	colorRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 4,
		marginVertical: 4,
	},
	colorSwatch: {
		borderWidth: 2,
		borderRadius: 14,
		height: 28,
		width: 28,
		minWidth: 28,
		padding: 0,
	},
	colorSwatchSelected: {
		borderWidth: 3,
		height: 30,
		width: 30,
	},
	input: {
		flex: 1,
	},
});

export default TagEditModal;
