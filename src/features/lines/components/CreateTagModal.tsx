/**
 * External dependencies
 */
import { FC, useCallback, useContext, useState } from 'react';
import { TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sprintf } from 'sprintf-js';

/**
 * Internal dependencies
 */
import ModalWrapper from '../../../components/generic/wrapper/ModalWrapper';
import ColorPaletteInline from '../../../components/generic/controls/ColorPaletteInline';
import { createTags } from '../db/actionsTag';
import { invalidateTagsTable } from '../db/queryFns';
import { Tag } from '../types';
import { tableStyles } from './tableStyles';
import { logError } from '../../../lib/utils';
import { ErrorToastContext } from '../../../components/ErrorToast/Context';
import { PALETTE_COLORS } from '../../../constants';

export interface CreateTagModalProps {
	visible: boolean;
	onDismiss: () => void;
	onCreated?: (tag: Tag) => void;
}

const CreateTagModal: FC<CreateTagModalProps> = ({ visible, onDismiss, onCreated }) => {
	const { t } = useTranslation();
	const { showError } = useContext(ErrorToastContext);
	const queryClient = useQueryClient();

	const [label, setLabel] = useState('');
	const [color, setColor] = useState(PALETTE_COLORS[0].bg);
	const [notes, setNotes] = useState('');

	const createMutation = useMutation({
		mutationFn: async (vars: { label: string; color: string; notes: string | null }) => {
			const inserted = await createTags([
				{ label: vars.label, notes: vars.notes, data: { color: vars.color } },
			]);
			return inserted;
		},
		onSuccess: async (inserted, vars) => {
			invalidateTagsTable(queryClient);
			queryClient.invalidateQueries({ queryKey: ['tags'] });
			if (inserted?.length) {
				await onCreated?.({
					id: inserted[0].id,
					timestamp: new Date().toISOString(),
					label: vars.label,
					notes: vars.notes,
					data: { color: vars.color },
				});
			}
			setLabel('');
			setColor(PALETTE_COLORS[0].bg);
			setNotes('');
		},
		onError: (err) => {
			logError('CreateTagModal', err);
			showError(sprintf(t('errorGeneric'), err instanceof Error ? err.message : String(err)));
		},
	});

	const handleDismiss = useCallback(() => {
		if (label.trim() && !createMutation.isPending) {
			createMutation.mutate({ label: label.trim(), color, notes: notes.trim() || null });
		}
		onDismiss();
	}, [
		label,
		color,
		notes,
		createMutation,
		onDismiss,
	]);

	return (
		<ModalWrapper
			visible={visible}
			onDismiss={handleDismiss}
			headerLabel={t('lines.tagsCreateTitle')}
			innerStyle={tableStyles.modalInner}
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
		</ModalWrapper>
	);
};

export default CreateTagModal;
