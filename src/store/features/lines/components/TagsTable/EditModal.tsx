/**
 * External dependencies
 */
import { FC, Fragment, useCallback, useContext, useEffect, useState } from 'react';
import { View } from 'react-native';
import { Text, TextInput, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { get } from 'lodash-es';
import { sprintf } from 'sprintf-js';

/**
 * Internal dependencies
 */
import { ErrorToastContext } from '../../../../../components/ErrorToast/Context';
import { logError } from '../../../../../lib/utils';
import ModalWrapper from '../../../../../components/generic/ModalWrapper';
import ButtonHighlight from '../../../../../components/generic/ButtonHighlight';
import { updateTag, deleteTag } from '../../db/actionsTag';
import { Tag } from '../../types';
import { getTagColor, TAG_COLORS } from '../tagColor';
import { featureRegistry } from '../../../FeatureRegistry';
import { sharedStyles } from './sharedDeps';
import { sharedStyles as appSharedStyles } from '../../../../../sharedStyles';
import ColorPaletteInline from './ColorPaletteInline';

const TagEditModal: FC<{
	visible: boolean;
	tag: (Tag & { line_count: number }) | null;
	onDismiss: () => void;
}> = ({ visible, tag, onDismiss }) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const { showError } = useContext(ErrorToastContext);
	const queryClient = useQueryClient();

	const [label, setLabel] = useState('');
	const [color, setColor] = useState(TAG_COLORS[0].bg);
	const [confirmDelete, setConfirmDelete] = useState(false);

	useEffect(() => {
		if (tag && visible) {
			setLabel(tag.label ?? '');
			const c = getTagColor(tag);
			setColor(c.bg);
		}
	}, [tag, visible]);

	const isSystemTag = tag
		? featureRegistry.getSystemTagLabels().includes(tag.label ?? '')
		: false;

	const updateMutation = useMutation({
		mutationFn: async (vars: { id: number; label: string; color: string }) => {
			await updateTag(vars.id, {
				label: vars.label,
				data: { color: vars.color },
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['tagsTable'] });
			queryClient.invalidateQueries({ queryKey: ['tags'] });
			queryClient.invalidateQueries({ queryKey: ['lines'] });
			queryClient.refetchQueries({ queryKey: ['tagsTable'] });
			onDismiss();
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
			queryClient.invalidateQueries({ queryKey: ['tagsTable'] });
			queryClient.invalidateQueries({ queryKey: ['tags'] });
			queryClient.invalidateQueries({ queryKey: ['lines'] });
			queryClient.refetchQueries({ queryKey: ['tagsTable'] });
			onDismiss();
		},
		onError: (err) => {
			logError('TagEditModal.deleteTag', err);
			showError(sprintf(t('errorGeneric'), err instanceof Error ? err.message : String(err)));
		},
	});

	const handleSave = useCallback(() => {
		if (!tag || !label.trim() || updateMutation.isPending) return;
		updateMutation.mutate({ id: tag.id, label: label.trim(), color });
	}, [
		tag,
		label,
		color,
		updateMutation,
	]);

	const handleDelete = useCallback(() => {
		if (!tag || deleteMutation.isPending) return;
		setConfirmDelete(true);
	}, [tag, deleteMutation]);

	const handleConfirmDelete = useCallback(() => {
		if (!tag) return;
		setConfirmDelete(false);
		deleteMutation.mutate(tag.id);
	}, [tag, deleteMutation]);

	const handleDismissConfirmDelete = useCallback(() => {
		setConfirmDelete(false);
	}, []);

	return (
		<Fragment>
			<ModalWrapper
				visible={visible}
				onDismiss={onDismiss}
				header={t('lines.editTag')}
				innerStyle={sharedStyles.modalInner}
			>
				<TextInput
					value={label}
					onChangeText={setLabel}
					placeholder={t('lines.tagsNewPlaceholder')}
					mode="outlined"
					dense
					disabled={isSystemTag}
				/>
				<ColorPaletteInline
					selectedColor={color}
					onSelect={setColor}
				/>
				<ButtonHighlight
					onPress={handleSave}
					mode="contained"
					disabled={!label.trim() || updateMutation.isPending}
					buttonColor={get(theme.colors, 'successContainer')}
					textColor={get(theme.colors, 'onSuccessContainer')}
				>
					<Text>{t('lines.saveFilter')}</Text>
				</ButtonHighlight>
				<ButtonHighlight
					onPress={handleDelete}
					mode="contained"
					disabled={isSystemTag || deleteMutation.isPending}
					buttonColor={isSystemTag ? undefined : theme.colors.errorContainer}
					textColor={isSystemTag ? undefined : theme.colors.onErrorContainer}
				>
					<Text
						style={{
							color: isSystemTag
								? theme.colors.onSurfaceDisabled
								: theme.colors.onErrorContainer,
						}}
					>
						{t('lines.delete')}
					</Text>
				</ButtonHighlight>
			</ModalWrapper>

			<ModalWrapper
				visible={confirmDelete}
				onDismiss={handleDismissConfirmDelete}
				header={t('lines.deleteConfirm')}
				innerStyle={appSharedStyles.modal}
			>
				<Text>{sprintf(t('lines.tagsDeleteConfirmationBody'), 1)}</Text>

				<View style={appSharedStyles.modalControls}>
					<ButtonHighlight
						onPress={handleDismissConfirmDelete}
						mode="contained"
						buttonColor={get(theme.colors, 'successContainer')}
						textColor={get(theme.colors, 'onSuccessContainer')}
					>
						<Text>{t('cancel')}</Text>
					</ButtonHighlight>

					<ButtonHighlight
						onPress={handleConfirmDelete}
						mode="contained"
						buttonColor={theme.colors.errorContainer}
						textColor={theme.colors.onErrorContainer}
					>
						<Text>{t('lines.delete')}</Text>
					</ButtonHighlight>
				</View>
			</ModalWrapper>
		</Fragment>
	);
};

export default TagEditModal;
