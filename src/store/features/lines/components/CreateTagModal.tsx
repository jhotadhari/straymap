/**
 * External dependencies
 */
import { FC, useCallback, useContext, useState } from 'react';
import { TextInput, useTheme } from 'react-native-paper';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { get } from 'lodash-es';
import { sprintf } from 'sprintf-js';

/**
 * Internal dependencies
 */
import ModalWrapper from '../../../../components/generic/ModalWrapper';
import ButtonHighlight from '../../../../components/generic/ButtonHighlight';
import ColorPaletteInline from './TagsTable/ColorPaletteInline';
import { TAG_COLORS } from './tagColor';
import { createTags } from '../db/actionsTag';
import { Tag } from '../types';
import { sharedStyles } from './TagsTable/sharedDeps';
import { logError } from '../../../../lib/utils';
import { ErrorToastContext } from '../../../../components/ErrorToast/Context';

export interface CreateTagModalProps {
	visible: boolean;
	onDismiss: () => void;
	onCreated?: (tag: Tag) => void;
}

const CreateTagModal: FC<CreateTagModalProps> = ({ visible, onDismiss, onCreated }) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const { showError } = useContext(ErrorToastContext);

	const [label, setLabel] = useState('');
	const [color, setColor] = useState(TAG_COLORS[0].bg);
	const [notes, setNotes] = useState('');

	const createMutation = useMutation({
		mutationFn: async (vars: { label: string; color: string; notes: string | null }) => {
			const inserted = await createTags([
				{ label: vars.label, notes: vars.notes, data: { color: vars.color } },
			]);
			return inserted;
		},
		onSuccess: (inserted) => {
			if (inserted?.length) {
				onCreated?.({
					id: inserted[0].id,
					timestamp: new Date().toISOString(),
					label,
					notes: notes.trim() || null,
					data: { color },
				});
			}
			setLabel('');
			setColor(TAG_COLORS[0].bg);
			setNotes('');
			onDismiss();
		},
		onError: (err) => {
			logError('CreateTagModal', err);
			showError(sprintf(t('errorGeneric'), err instanceof Error ? err.message : String(err)));
		},
	});

	const handleCreate = useCallback(() => {
		if (!label.trim() || createMutation.isPending) return;
		createMutation.mutate({ label: label.trim(), color, notes: notes.trim() || null });
	}, [
		label,
		color,
		notes,
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
			<TextInput
				value={notes}
				onChangeText={setNotes}
				placeholder={t('lines.columns.notes')}
				mode="outlined"
				dense
				multiline
				numberOfLines={3}
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

export default CreateTagModal;
