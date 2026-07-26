/**
 * External dependencies
 */
import { ReactNode, useCallback, useMemo, useState } from 'react';
import { View, TouchableHighlight, StyleSheet, ViewProps, TextProps } from 'react-native';
import { useTheme, Text } from 'react-native-paper';

/**
 * Internal dependencies
 */
import InfoWrapper from './InfoWrapper';
import { LABEL_WIDTH } from '../../../constants';

const InfoLabelRow = ({
	label,
	labelNode,
	children,
	Info,
	Below,
	backgroundBlur = false,
	headerPlural = false,
	style,
	labelStyle,
	innerStyle,
	onLabelPress,
}: {
	label?: string;
	labelNode?: ReactNode;
	children?: ReactNode;
	Info?: ReactNode | string;
	Below?: ReactNode;
	backgroundBlur?: boolean;
	headerPlural?: boolean;
	style?: ViewProps['style'];
	labelStyle?: TextProps['style'];
	innerStyle?: ViewProps['style'];
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
			inner: [
				styles.controlView,
				innerStyle,
			],
		}),
		[
			style,
			theme,
			labelStyle,
			innerStyle,
		]
	);

	const handleLabelPress = useCallback(() => {
		onLabelPress && onLabelPress();
		Info && setModalVisible(true);
	}, [onLabelPress, Info]);

	const labelContent = labelNode ?? <Text style={dynamicStyles.label}>{label}</Text>;

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
						{labelNode ? (
							labelNode
						) : (
							<Text style={[dynamicStyles.label, styles.underline]}>{label}</Text>
						)}
					</TouchableHighlight>
				)}
				{!Info && !onLabelPress && labelContent}
				<View style={dynamicStyles.inner}>{children}</View>
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
		flex: 1,
	},
	label: {
		paddingTop: 4,
		paddingBottom: 4,
		paddingRight: 4,
		width: LABEL_WIDTH,
		flexWrap: 'wrap',
		alignItems: 'center',
	},
	underline: {
		textDecorationLine: 'underline',
	},
});

export default InfoLabelRow;
