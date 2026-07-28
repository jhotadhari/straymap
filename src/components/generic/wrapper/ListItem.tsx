/**
 * External dependencies
 */
import { ReactNode, useMemo } from 'react';
import { useTheme, Icon, Text } from 'react-native-paper';
import { StyleSheet, View, TouchableHighlight, ViewStyle } from 'react-native';
import { Style as ListStyle } from 'react-native-paper/lib/typescript/components/List/utils';

/**
 * Internal dependencies
 */
import { DRAWER_ICON_SIZE } from '../../../constants';

const ListItem = ({
	onPress,
	icon,
	iconSize,
	title,
	style,
}: {
	onPress?: () => void;
	icon?: string | ((props: { color: string; style: ListStyle }) => ReactNode);
	iconSize?: number;
	style?: null | ViewStyle;
	title?: ReactNode;
}) => {
	const theme = useTheme();

	const styleTouchable = useMemo(
		() => [styles.touchable, { borderRadius: theme.roundness }],
		[theme]
	);

	const styleInner = useMemo(
		() => [
			styles.inner,
			style,
		],
		[
			theme,
			style,
		]
	);

	return (
		<TouchableHighlight
			underlayColor={theme.colors.elevation.level3}
			onPress={onPress}
			style={styleTouchable}
		>
			<View style={styleInner}>
				{icon && (
					<View style={styles.iconWrapper}>
						<Icon
							source={icon}
							size={iconSize || DRAWER_ICON_SIZE}
						/>
					</View>
				)}
				<Text>{title}</Text>
			</View>
		</TouchableHighlight>
	);
};

const styles = StyleSheet.create({
	touchable: { overflow: 'visible' },
	inner: {
		padding: 15,
		marginLeft: 8,
		flexDirection: 'row',
		alignItems: 'center',
		overflow: 'visible',
	},
	iconWrapper: { marginRight: 10 },
});

export default ListItem;
