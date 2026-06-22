/**
 * External dependencies
 */
import { ReactNode, useMemo } from 'react';
import { Style as ListStyle } from 'react-native-paper/lib/typescript/components/List/utils';
import { useTheme, Icon, Text } from 'react-native-paper';
import { StyleSheet, View, TouchableHighlight, ViewStyle, TextStyle } from 'react-native';

const MenuItem = ({
	onPress,
	leadingIcon,
	iconSize,
	title,
	style,
	iconColor,
	textStyle,
	active,
}: {
	onPress?: () => void;
	leadingIcon?: string | ((props: { color: string; style: ListStyle }) => ReactNode);
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
				{leadingIcon && (
					<View style={styles.iconWrapper}>
						<Icon
							source={leadingIcon}
							size={iconSize || 25}
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
});

export default MenuItem;
