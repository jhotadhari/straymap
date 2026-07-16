/**
 * External dependencies
 */
import { ReactNode, useCallback, useMemo, useState } from 'react';
import { View, TouchableHighlight, ViewStyle, TextStyle, StyleSheet } from 'react-native';
import { useTheme, Text } from 'react-native-paper';

/**
 * Internal dependencies
 */
import InfoWrapper from './InfoWrapper';

export const labelMinWidth = 90;

const InfoLabelRow = ({
	label,
	children,
	Info,
	Below,
	backgroundBlur = false,
	headerPlural = false,
	style,
	labelStyle = {},
	onLabelPress,
}: {
	label?: string;
	children?: ReactNode;
	Info?: ReactNode | string;
	Below?: ReactNode;
	backgroundBlur?: boolean;
	headerPlural?: boolean;
	style?: ViewStyle;
	labelStyle?: TextStyle;
	onLabelPress?: () => void;
}) => {
	const theme = useTheme();

	const [modalVisible, setModalVisible] = useState(false);

	const dynamicStyles = useMemo(
		() => ({
			container: [
				styles.container,
				style,
			],
			button: { borderRadius: theme.roundness },
			label: [
				styles.label,
				labelStyle,
			],
		}),
		[
			style,
			theme,
			labelStyle,
		]
	);

	const handleLabelPress = useCallback(() => {
		onLabelPress && onLabelPress();
		Info && setModalVisible(true);
	}, [onLabelPress, Info]);

	return (
		<InfoWrapper
			label={label}
			Info={Info}
			Below={Below}
			backgroundBlur={backgroundBlur}
			headerPlural={headerPlural}
			modalVisible={modalVisible}
			setModalVisible={setModalVisible}
		>
			<View style={dynamicStyles.container}>
				{(Info || onLabelPress) && (
					<TouchableHighlight
						underlayColor={theme.colors.elevation.level3}
						onPress={handleLabelPress}
						style={dynamicStyles.button}
					>
						<Text style={[dynamicStyles.label, styles.underline]}>{label}</Text>
					</TouchableHighlight>
				)}
				{!Info && !onLabelPress && <Text style={dynamicStyles.label}>{label}</Text>}
				<View style={styles.controlView}>{children}</View>
			</View>
		</InfoWrapper>
	);
};

export const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		display: 'flex',
		alignItems: 'center',
		width: '100%',
		position: 'relative',
	},
	controlView: {
		position: 'relative',
		flexGrow: 1,
	},
	label: {
		paddingTop: 4,
		paddingBottom: 4,
		paddingRight: 4,
		minWidth: labelMinWidth + 12,
	},
	underline: {
		textDecorationLine: 'underline',
	},
});

export default InfoLabelRow;
