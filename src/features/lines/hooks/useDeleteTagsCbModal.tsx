/**
 * External dependencies
 */
import { useCallback, useMemo, useState } from 'react';
import { get } from 'lodash-es';
import { useMutation } from '@tanstack/react-query';
import { Text, useTheme } from 'react-native-paper';
import { sprintf } from 'sprintf-js';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import ButtonHighlight from '../../../components/generic/primitives/ButtonHighlight';
import ModalWrapper from '../../../components/generic/wrapper/ModalWrapper';
import { sharedStyles } from '../../../sharedStyles';
import { deleteTag } from '../db/actionsTag';

const useDeleteTagsCbModal = ({
	deleteIds,
	onSuccess,
}: {
	deleteIds: number[];
	onSuccess?: () => void;
}) => {
	const { t } = useTranslation();
	const theme = useTheme();

	const [modalVisible, setModalVisible] = useState(false);

	const cb = useCallback(() => {
		setModalVisible(true);
	}, []);

	const handleDismissModal = useCallback(() => setModalVisible(false), []);

	const mutation = useMutation({
		mutationFn: async (ids: number[]) => {
			for (const id of ids) {
				await deleteTag(id);
			}
		},
		onSuccess: async () => {
			handleDismissModal();
			onSuccess?.();
		},
	});

	const handleDelete = useCallback(() => {
		mutation.mutate(deleteIds);
	}, [deleteIds, mutation]);

	const modalNode = useMemo(() => {
		if (!modalVisible) {
			return undefined;
		}

		return (
			<ModalWrapper
				visible={modalVisible}
				onDismiss={handleDismissModal}
				headerLabel={t('lines.deleteConfirm')}
				innerStyle={sharedStyles.modal}
			>
				<Text>{sprintf(t('lines.tagsDeleteConfirmationBody'), deleteIds.length)}</Text>

				<View style={sharedStyles.modalControls}>
					<ButtonHighlight
						onPress={handleDismissModal}
						mode="contained"
						buttonColor={get(theme.colors, 'successContainer')}
						textColor={get(theme.colors, 'onSuccessContainer')}
					>
						<Text>{t('cancel')}</Text>
					</ButtonHighlight>

					<ButtonHighlight
						onPress={handleDelete}
						mode="contained"
						buttonColor={theme.colors.errorContainer}
						textColor={theme.colors.onErrorContainer}
					>
						<Text>{t('lines.delete')}</Text>
					</ButtonHighlight>
				</View>
			</ModalWrapper>
		);
	}, [
		t,
		deleteIds.length,
		modalVisible,
		handleDismissModal,
		theme,
		handleDelete,
	]);

	return useMemo(
		() => ({
			cb,
			modalNode,
		}),
		[cb, modalNode]
	);
};

export default useDeleteTagsCbModal;
