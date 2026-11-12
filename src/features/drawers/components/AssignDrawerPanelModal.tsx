/**
 * External dependencies
 */
import { FC } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { sprintf } from 'sprintf-js';

/**
 * Internal dependencies
 */
import ModalWrapper from '../../../components/generic/wrapper/ModalWrapper';
import ButtonHighlight from '../../../components/generic/primitives/ButtonHighlight';
import { useButtonProps } from '../../../compose/useButtonProps';

/**
 * Modal offered when an action needs a drawer panel that isn't assigned
 * to any side yet: explains the situation and adds + opens the panel on
 * the side the user picks. Dismissable via the header back button or a
 * backdrop press (default ModalWrapper behavior).
 */
const AssignDrawerPanelModal: FC<{
	visible: boolean;
	panelLabel: string;
	onDismiss: () => void;
	onAssign: (side: 'left' | 'right') => void;
}> = ({ visible, panelLabel, onDismiss, onAssign }) => {
	const { t } = useTranslation();

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { nestedIconColor: _nestedIconColor, ...buttonProps } = useButtonProps({});

	return (
		<ModalWrapper
			visible={visible}
			onDismiss={onDismiss}
			headerLabel={t('drawers.addPanelToSide')}
			innerStyle={styles.inner}
		>
			<Text>{sprintf(t('drawers.addPanelToSideBody'), panelLabel)}</Text>

			<View style={styles.buttonsRow}>
				<ButtonHighlight
					{...buttonProps}
					style={styles.button}
					onPress={() => onAssign('left')}
				>
					{t('drawers.sectionLeft')}
				</ButtonHighlight>

				<ButtonHighlight
					{...buttonProps}
					style={styles.button}
					onPress={() => onAssign('right')}
				>
					{t('drawers.sectionRight')}
				</ButtonHighlight>
			</View>
		</ModalWrapper>
	);
};

const styles = StyleSheet.create({
	inner: {
		gap: 16,
		marginTop: 16,
	},
	buttonsRow: {
		flexDirection: 'row',
		gap: 16,
	},
	button: {
		flex: 1,
	},
});

export default AssignDrawerPanelModal;
