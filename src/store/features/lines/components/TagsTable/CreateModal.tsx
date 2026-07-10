/**
 * External dependencies
 */
import { FC, useCallback, useContext, useState } from 'react';
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
import { createTags } from '../../db/actionsTag';
import { invalidateTagsTable } from '../../db/queryFns';
import { TAG_COLORS } from '../tagColor';
import { sharedStyles } from './sharedDeps';
import ColorPaletteInline from './ColorPaletteInline';

const TagCreateModal: FC<{
	visible: boolean;
	onDismiss: () => void;
}> = ({ visible, onDismiss }) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const { showError } = useContext(ErrorToastContext);
	const queryClient = useQueryClient();

	const [label, setLabel] = useState('');
	const [color, setColor] = useState(TAG_COLORS[0].bg);

	const createMutation = useMutation({
		mutationFn: async (vars: { label: string; color: string }) => {
			await createTags([{ label: vars.label, notes: null, data: { color: vars.color } }]);
		},
		onSuccess: () => {
			invalidateTagsTable(queryClient);
			queryClient.invalidateQueries({ queryKey: ['tags'] });
			setLabel('');
			setColor(TAG_COLORS[0].bg);
			onDismiss();
		},
		onError: (err) => {
			logError('TagCreateModal', err);
			showError(sprintf(t('errorGeneric'), err instanceof Error ? err.message : String(err)));
		},
	});

	const handleCreate = useCallback(() => {
		if (!label.trim() || createMutation.isPending) return;
		createMutation.mutate({ label: label.trim(), color });
	}, [
		label,
		color,
		createMutation,
	]);

	return (
		<ModalWrapper
			visible={visible}
			onDismiss={onDismiss}
			header={t('lines.tagsCreateTitle')}
			innerStyle={sharedStyles.modalInner}
		>
			<TextInput
				value={label}
				onChangeText={setLabel}
				placeholder={t('lines.tagsNewPlaceholder')}
				mode="outlined"
				dense
			/>
			<ColorPaletteInline
				selectedColor={color}
				onSelect={setColor}
			/>
			<ButtonHighlight
				onPress={handleCreate}
				mode="contained"
				disabled={!label.trim() || createMutation.isPending}
				buttonColor={get(theme.colors, 'successContainer')}
				textColor={get(theme.colors, 'onSuccessContainer')}
			>
				<Text>{t('lines.tagsCreate')}</Text>
			</ButtonHighlight>
		</ModalWrapper>
	);
};

export default TagCreateModal;
