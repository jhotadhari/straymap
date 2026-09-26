/**
 * External dependencies
 */
import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import ButtonHighlight from '../../../components/generic/primitives/ButtonHighlight';
import ModalWrapper from '../../../components/generic/wrapper/ModalWrapper';
import { useButtonProps } from '../../../compose/useButtonProps';
import { sharedStyles } from '../../../sharedStyles';

/**
 * Confirmation modal for removing an altitude profile from the bottom
 * drawer. Nothing is deleted — the line stays on the map and the profile
 * can be toggled on again at any time, so the confirm action is styled
 * neutrally (no destructive red).
 */
const useRemoveProfileCbModal = ({
	onRemove,
	onSuccess,
	backgroundBlur = false,
}: {
	onRemove: () => void;
	onSuccess?: () => void;
	backgroundBlur?: boolean;
}) => {
	const { t } = useTranslation();

	const buttonPropsCancel = useButtonProps({ isSuccess: true });
	const buttonPropsConfirm = useButtonProps({ isDestructive: true });

	const [modalVisible, setModalVisible] = useState(false);

	const cb = useCallback(() => {
		setModalVisible(true);
	}, []);

	const handleDismissModal = useCallback(() => setModalVisible(false), []);

	const handleConfirm = useCallback(() => {
		handleDismissModal();
		onRemove();
		onSuccess && onSuccess();
	}, [
		handleDismissModal,
		onRemove,
		onSuccess,
	]);

	const modalNode = useMemo(() => {
		if (!modalVisible) {
			return undefined;
		}

		return (
			<ModalWrapper
				visible={modalVisible}
				backgroundBlur={backgroundBlur}
				onDismiss={handleDismissModal}
				headerLabel={t('altitudeProfile.removeProfile')}
				innerStyle={sharedStyles.modal}
			>
				<Text>{t('altitudeProfile.removeProfileConfirmBody')}</Text>

				<View style={sharedStyles.modalControls}>
					<ButtonHighlight
						onPress={handleDismissModal}
						{...buttonPropsCancel}
					>
						{t('cancel')}
					</ButtonHighlight>

					<ButtonHighlight
						onPress={handleConfirm}
						{...buttonPropsConfirm}
					>
						{t('altitudeProfile.removeProfile')}
					</ButtonHighlight>
				</View>
			</ModalWrapper>
		);
	}, [
		modalVisible,
		backgroundBlur,
		handleDismissModal,
		handleConfirm,
		buttonPropsCancel,
		buttonPropsConfirm,
		t,
	]);

	return useMemo(
		() => ({
			cb,
			modalNode,
		}),
		[cb, modalNode]
	);
};

export default useRemoveProfileCbModal;
