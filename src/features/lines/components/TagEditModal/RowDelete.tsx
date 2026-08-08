/**
 * External dependencies
 */
import { FC, useCallback, useContext, useState } from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sprintf } from 'sprintf-js';

/**
 * Internal dependencies
 */
import { TagEditModalContext } from './Context';
import InfoLabelRow from '../../../../components/generic/infoWrapper/InfoLabelRow';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import ModalWrapper from '../../../../components/generic/wrapper/ModalWrapper';
import { deleteTag } from '../../db/actionsTag';
import { invalidateTagsTable, invalidateLinesQueries } from '../../db/queryFns';
import { featureRegistry } from '../../../FeatureRegistry';
import { ErrorToastContext } from '../../../../components/ErrorToast/Context';
import { logError } from '../../../../lib/utils';
import { sharedStyles as appSharedStyles } from '../../../../sharedStyles';
import { useButtonProps } from '../../../../compose/useButtonProps';

const RowDelete: FC = () => {
	const { t } = useTranslation();
	const { showError } = useContext(ErrorToastContext);
	const queryClient = useQueryClient();

	const { tag, onDismiss } = useContext(TagEditModalContext);

	const [confirmVisible, setConfirmVisible] = useState(false);

	const isSystemTag = tag
		? featureRegistry.getSystemTagLabels().includes(tag.label ?? '')
		: false;

	const deleteMutation = useMutation({
		mutationFn: async (id: number) => {
			await deleteTag(id);
		},
		onSuccess: async () => {
			invalidateTagsTable(queryClient);
			queryClient.invalidateQueries({ queryKey: ['tags'] });
			await invalidateLinesQueries(queryClient);
			setConfirmVisible(false);
			onDismiss();
		},
		onError: (err) => {
			logError('RowDelete', err);
			showError(sprintf(t('errorGeneric'), err instanceof Error ? err.message : String(err)));
		},
	});

	const handlePress = useCallback(() => {
		setConfirmVisible(true);
	}, []);

	const handleConfirm = useCallback(() => {
		if (!tag) return;
		deleteMutation.mutate(tag.id);
	}, [tag, deleteMutation]);

	const handleDismissConfirm = useCallback(() => {
		setConfirmVisible(false);
	}, []);

	const buttonPropsAnchor = useButtonProps({
		isDestructive: true,
		disabled: isSystemTag || deleteMutation.isPending,
		paddingHorizontal: true,
	});

	const buttonPropsCancel = useButtonProps({
		isSuccess: true,
		paddingHorizontal: true,
	});

	const buttonPropsDelete = useButtonProps({
		isDestructive: true,
		paddingHorizontal: true,
	});

	return (
		<>
			<InfoLabelRow
				label={t('lines.delete')}
				Info={t('lines.hintDelete')}
			>
				<ButtonHighlight
					{...buttonPropsAnchor}
					onPress={handlePress}
				>
					{t('lines.delete')}
				</ButtonHighlight>
			</InfoLabelRow>

			<ModalWrapper
				visible={confirmVisible}
				onDismiss={handleDismissConfirm}
				headerLabel={t('lines.deleteConfirm')}
				innerStyle={appSharedStyles.modal}
			>
				<Text>{sprintf(t('lines.tagsDeleteConfirmationBody'), 1)}</Text>

				<View style={appSharedStyles.modalControls}>
					<ButtonHighlight
						{...buttonPropsCancel}
						onPress={handleDismissConfirm}
					>
						{t('cancel')}
					</ButtonHighlight>

					<ButtonHighlight
						onPress={handleConfirm}
						{...buttonPropsDelete}
					>
						{t('lines.delete')}
					</ButtonHighlight>
				</View>
			</ModalWrapper>
		</>
	);
};

export default RowDelete;
