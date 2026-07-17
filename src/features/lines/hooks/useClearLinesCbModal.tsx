/**
 * External dependencies
 */
import { useCallback, useMemo, useState } from 'react';
import { get } from 'lodash-es';
import { Text, useTheme } from 'react-native-paper';
import { sprintf } from 'sprintf-js';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import ButtonHighlight from '../../../components/generic/primitives/ButtonHighlight';
import ModalWrapper from '../../../components/generic/wrapper/ModalWrapper';
import { useAppDispatch, useSystemLineIds } from '../../../store/hooks';
import { sharedStyles } from '../../../sharedStyles';
import { setSelected } from '../slice';

const useClearLinesCbModal = ({
	lineIds,
	backgroundBlur,
}: {
	lineIds: number[];
	backgroundBlur?: boolean;
}) => {
	const dispatch = useAppDispatch();

	const systemLineIds = useSystemLineIds();

	const { t } = useTranslation();

	const theme = useTheme();

	const [modalVisible, setModalVisible] = useState(false);

	const cb = useCallback(() => {
		setModalVisible(true);
	}, []);

	const handleDismissModal = useCallback(() => setModalVisible(false), []);

	const handleClearLines = useCallback(() => {
		const systemIds = new Set(Object.values(systemLineIds));
		const filtered = lineIds.filter((id) => systemIds.has(id));
		dispatch(setSelected(filtered));
		handleDismissModal();
	}, [
		dispatch,
		handleDismissModal,
		lineIds,
		systemLineIds,
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
				headerLabel={t('lines.clearLinesConfirm')}
				innerStyle={sharedStyles.modal}
			>
				<Text>{sprintf(t('lines.clearLinesConfirmationBody'), lineIds.length)}</Text>

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
						onPress={handleClearLines}
						mode="contained"
						buttonColor={theme.colors.errorContainer}
						textColor={theme.colors.onErrorContainer}
					>
						<Text>{t('lines.clearLinesFromMap')}</Text>
					</ButtonHighlight>
				</View>
			</ModalWrapper>
		);
	}, [
		t,
		lineIds.length,
		modalVisible,
		handleDismissModal,
		theme,
		handleClearLines,
		backgroundBlur,
	]);

	return useMemo(
		() => ({
			cb,
			modalNode,
			iconSource: 'map-marker-remove',
		}),
		[cb, modalNode]
	);
};

export default useClearLinesCbModal;
