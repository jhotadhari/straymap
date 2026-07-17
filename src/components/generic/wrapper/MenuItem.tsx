/**
 * External dependencies
 */
import { ElementType, ReactNode, useMemo } from 'react';
import { Style as ListStyle } from 'react-native-paper/lib/typescript/components/List/utils';
import { useTheme, Icon, Text } from 'react-native-paper';
import { StyleSheet, View, TouchableHighlight, ViewStyle, TextStyle } from 'react-native';

/**
 * Internal dependencies
 */
import { DRAWER_ICON_SIZE } from '../../../constants';

const MenuItem = ({
	onPress,
	leadingIcon,
	IconComponent,
	iconSize,
	title,
	style,
	iconColor,
	textStyle,
	active,
}: {
	onPress?: () => void;
	leadingIcon?: string | ((props: { color: string; style: ListStyle }) => ReactNode);
	IconComponent?: ElementType<{ color?: TextStyle['color']; size?: number }>;
	iconSize?: number;
	style?: null | ViewStyle;
	iconColor?: string;
	textStyle?: null | TextStyle;
	title?: ReactNode;
	active?: boolean;
}) => {
	const theme = useTheme();

	const styleInner = useMemo(
		() => [
			styles.inner,
			active && { backgroundColor: theme.colors.primary },
			style,
		],
		[
			active,
			theme,
			style,
		]
	);

	const styleTitle = useMemo(
		() => [active && { color: theme.colors.onPrimary }, textStyle],
		[
			active,
			theme,
			textStyle,
		]
	);

	return (
		<TouchableHighlight
			underlayColor={theme.colors.elevation.level3}
			onPress={onPress}
		>
			<View style={styleInner}>
				{IconComponent && (
					<View style={styles.iconWrapper}>
						<View style={styles.iconComponentWrapper}>
							<IconComponent
								color={
									iconColor
										? iconColor
										: active
											? theme.colors.onPrimary
											: theme.colors.onBackground
								}
								size={iconSize || DRAWER_ICON_SIZE}
							/>
						</View>
					</View>
				)}
				{!IconComponent && leadingIcon && (
					<View style={styles.iconWrapper}>
						<Icon
							source={leadingIcon}
							size={iconSize || DRAWER_ICON_SIZE}
							color={
								iconColor ? iconColor : active ? theme.colors.onPrimary : undefined
							}
						/>
					</View>
				)}
				{title && 'string' === typeof title && <Text style={styleTitle}>{title}</Text>}
				{title && 'string' !== typeof title && title}
			</View>
		</TouchableHighlight>
	);
};

const styles = StyleSheet.create({
	inner: {
		padding: 10,
		flexDirection: 'row',
		alignItems: 'center',
	},
	iconWrapper: { marginRight: 10 },
	iconComponentWrapper: {
		width: DRAWER_ICON_SIZE,
		height: DRAWER_ICON_SIZE,
		overflow: 'hidden',
		alignItems: 'center',
		justifyContent: 'center',
	},
});

export default MenuItem;
