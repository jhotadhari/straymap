/**
 * External dependencies
 */
import { ElementType, memo, ReactNode, useMemo } from 'react';
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
	iconSize: iconSize_,
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

	const { iconSize, iconComponentWrapperStyle } = useMemo(() => {
		const size = iconSize_ || DRAWER_ICON_SIZE;
		return {
			iconSize: size,
			iconComponentWrapperStyle: [
				styles.iconComponentWrapper,
				{
					width: size,
					height: size,
				},
			],
		};
	}, [
		iconSize_,
	]);

	return (
		<TouchableHighlight
			underlayColor={theme.colors.elevation.level3}
			onPress={onPress}
		>
			<View style={styleInner}>
				{IconComponent && (
					<View style={styles.iconWrapper}>
						<View style={iconComponentWrapperStyle}>
							<IconComponent
								color={
									iconColor
										? iconColor
										: active
											? theme.colors.onPrimary
											: theme.colors.onBackground
								}
								size={iconSize}
							/>
						</View>
					</View>
				)}
				{!IconComponent && leadingIcon && (
					<View style={styles.iconWrapper}>
						<Icon
							source={leadingIcon}
							size={iconSize}
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
	iconWrapper: {
		marginRight: 10,
	},
	iconComponentWrapper: {
		overflow: 'hidden',
		alignItems: 'center',
		justifyContent: 'center',
	},
});

export default memo(MenuItem);
