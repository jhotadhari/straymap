/**
 * External dependencies
 */
import { FC } from 'react';
import { StyleProp, StyleSheet, TextStyle, View, ViewStyle } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

/**
 * Internal dependencies
 */
import IconButtonHighlight from '../../../components/generic/primitives/IconButtonHighlight';
import { itemStyles } from '../constants';

interface DrawerPanelHeadingProps {
	title: string;
	/**
	 * Optional action icon button rendered on the right (e.g. the
	 * settings cog). Rendered only when both `actionIcon` and
	 * `onActionPress` are provided.
	 */
	actionIcon?: string;
	onActionPress?: () => void;
	actionAccessibilityLabel?: string;
	actionDisabled?: boolean;
	/**
	 * Layout overrides for the row and the title. `itemStyles.buttonRow`
	 * is baked in so the heading keeps the same margins as the panel's
	 * other rows; panels pass their height/offset tweaks via `style`.
	 */
	style?: StyleProp<ViewStyle>;
	titleStyle?: StyleProp<TextStyle>;
}

/**
 * Shared heading row for drawer panels: bold title on the left and an
 * optional action icon button on the right.
 */
const DrawerPanelHeading: FC<DrawerPanelHeadingProps> = ({
	title,
	actionIcon,
	onActionPress,
	actionAccessibilityLabel,
	actionDisabled,
	style,
	titleStyle,
}) => {
	const theme = useTheme();

	return (
		<View
			style={[
				itemStyles.buttonRow,
				styles.row,
				style,
			]}
		>
			<Text style={[styles.heading, titleStyle]}>{title}</Text>
			{actionIcon && onActionPress && (
				<IconButtonHighlight
					icon={actionIcon}
					iconColor={theme.colors.onSurfaceVariant}
					onPress={onActionPress}
					accessibilityLabel={actionAccessibilityLabel}
					disabled={actionDisabled}
				/>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	heading: {
		fontSize: 20,
		fontWeight: 'bold',
	},
});

export default DrawerPanelHeading;
