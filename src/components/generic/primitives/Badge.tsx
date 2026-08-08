/**
 * External dependencies
 */
import { FC, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

/**
 * Internal dependencies
 */
import { PaletteColor } from '../../../types';

const Badge: FC<{
	badgeMode: 'outlined' | 'contained';
	color: PaletteColor;
	label?: string | null;
}> = ({ badgeMode, color, label }) => {
	const isOutlined = badgeMode === 'outlined';

	const badgeStyle = useMemo(
		() => ({
			backgroundColor: isOutlined ? 'transparent' : color.bg,
			borderColor: isOutlined ? color.bg : color.border,
		}),
		[
			isOutlined,
			color.bg,
			color.border,
		]
	);

	const labelStyle = useMemo(
		() => (isOutlined ? undefined : { color: color.fg }),
		[isOutlined, color.fg]
	);

	return (
		<View style={[styles.badge, badgeStyle]}>
			<Text style={[styles.label, labelStyle]}>{label ?? ''}</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	badge: {
		borderRadius: 12,
		borderWidth: 1,
		paddingHorizontal: 8,
		paddingVertical: 2,
		marginHorizontal: 2,
		marginVertical: 2,
		alignSelf: 'flex-start',
	},
	label: {
		fontSize: 11,
		fontWeight: '600',
	},
});

export default Badge;
