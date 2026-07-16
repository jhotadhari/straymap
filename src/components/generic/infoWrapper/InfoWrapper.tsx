/**
 * External dependencies
 */
import { ReactNode, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { sprintf } from 'sprintf-js';

/**
 * Internal dependencies
 */
import ModalWrapper from '../wrapper/ModalWrapper';

const InfoWrapper = ({
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

	const handleClose = useCallback(() => setModalVisible(false), [setModalVisible]);

	return (
		<View style={{ flex: 1 }}>
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

export default InfoWrapper;
