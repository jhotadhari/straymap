/**
 * External dependencies
 */
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import ButtonHighlight from '../../../components/generic/primitives/ButtonHighlight';
import ModalWrapper from '../../../components/generic/wrapper/ModalWrapper';
import { useButtonProps } from '../../../compose/useButtonProps';
import { useAppDispatch } from '../../../store/hooks';
import { sharedStyles } from '../../../sharedStyles';
import { stopRecording } from '../slice';

/**
 * Stop-recording confirmation modal (mirrors the useDeleteLinesCbModal
 * pattern).  Returns `cb` (opens the modal) and `modalNode` (render
 * where the modal should live).  Confirm dispatches stopRecording —
 * stop and pause are the same, the recorded line stays in the DB.
 */
const useStopRecordingCbModal = () => {
	const dispatch = useAppDispatch();
	const { t } = useTranslation();

	const [modalVisible, setModalVisible] = useState(false);

	const buttonPropsCancel = useButtonProps({ mode: 'outlined' });
	const buttonPropsStop = useButtonProps({ isDestructive: true });

	const handleDismiss = useCallback(() => setModalVisible(false), []);

	const handleStop = useCallback(() => {
		setModalVisible(false);
		dispatch(stopRecording());
	}, [dispatch]);

	const cb = useCallback(() => setModalVisible(true), []);

	const modalNode = useMemo(() => {
		if (!modalVisible) {
			return undefined;
		}

		return (
			<ModalWrapper
				visible={modalVisible}
				onDismiss={handleDismiss}
				headerLabel={t('trackRecording.stop')}
				innerStyle={sharedStyles.modal}
			>
				<Text>{t('trackRecording.stopConfirmBody')}</Text>

				<View style={styles.controls}>
					<ButtonHighlight
						onPress={handleDismiss}
						{...buttonPropsCancel}
					>
						{t('cancel')}
					</ButtonHighlight>

					<ButtonHighlight
						onPress={handleStop}
						{...buttonPropsStop}
					>
						{t('trackRecording.stop')}
					</ButtonHighlight>
				</View>
			</ModalWrapper>
		);
	}, [
		modalVisible,
		handleDismiss,
		handleStop,
		buttonPropsCancel,
		buttonPropsStop,
		t,
	]);

	return useMemo(() => ({ cb, modalNode }), [cb, modalNode]);
};

const styles = StyleSheet.create({
	controls: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		alignItems: 'center',
		gap: 12,
		marginBottom: 40,
	},
});

export default useStopRecordingCbModal;
