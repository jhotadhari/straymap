/**
 * External dependencies
 */
import { useCallback, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Text } from 'react-native-paper';
import { sprintf } from 'sprintf-js';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import ButtonHighlight from '../../../components/generic/primitives/ButtonHighlight';
import ModalWrapper from '../../../components/generic/wrapper/ModalWrapper';
import { useButtonProps } from '../../../compose/useButtonProps';
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

	const buttonPropsSuccess = useButtonProps({ isSuccess: true });
	const buttonPropsDelete = useButtonProps({ isDestructive: true });

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
						{...buttonPropsSuccess}
					>
						{t('cancel')}
					</ButtonHighlight>

					<ButtonHighlight
						onPress={handleDelete}
						{...buttonPropsDelete}
					>
						{t('lines.delete')}
					</ButtonHighlight>
				</View>
			</ModalWrapper>
		);
	}, [
		t,
		deleteIds.length,
		modalVisible,
		handleDismissModal,
		buttonPropsSuccess,
		buttonPropsDelete,
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
