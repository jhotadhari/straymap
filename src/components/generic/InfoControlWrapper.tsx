/**
 * External dependencies
 */
import { ReactNode, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { get } from 'lodash-es';
import { sprintf } from 'sprintf-js';

/**
 * Internal dependencies
 */
import ButtonHighlight from './ButtonHighlight';
import ModalWrapper from './ModalWrapper';

const InfoControlWrapper = ({
	label,
	labelPattern = 'whatIs',
	children,
	Info,
	Below,
	backgroundBlur = false,
	headerPlural = false,
	modalVisible,
	setModalVisible,
}: {
	label?: string;
	labelPattern?: string;
	children: ReactNode;
	Info?: ReactNode | string;
	Below?: ReactNode;
	backgroundBlur?: boolean;
	headerPlural?: boolean;
	modalVisible: boolean;
	setModalVisible: (visible: boolean) => void;
}) => {
	const { t } = useTranslation();
	const theme = useTheme();

	const handleClose = useCallback(() => setModalVisible(false), [setModalVisible]);

	return (
		<View>
			{modalVisible && (
				<ModalWrapper
					visible={modalVisible}
					backgroundBlur={!!backgroundBlur}
					onDismiss={handleClose}
					header={sprintf(t(labelPattern, { count: headerPlural ? 0 : 1 }), label || '')}
				>
					<View style={styles.infoWrapper}>
						{Info && 'string' === typeof Info && <Text>{Info}</Text>}
						{Info && 'string' !== typeof Info && Info}
					</View>

					<ButtonHighlight
						style={styles.okButton}
						onPress={handleClose}
						mode="contained"
						buttonColor={get(theme.colors, 'successContainer')}
						textColor={get(theme.colors, 'onSuccessContainer')}
					>
						<Text>{t('gotIt')}</Text>
					</ButtonHighlight>
				</ModalWrapper>
			)}

			{children}

			{Below}
		</View>
	);
};

const styles = StyleSheet.create({
	infoWrapper: { marginTop: 20, marginBottom: 20 },
	okButton: { marginTop: 20, marginBottom: 40 },
});

export default InfoControlWrapper;
