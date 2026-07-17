/* eslint-disable react-native/no-inline-styles */
/**
 * External dependencies
 */
import { FC } from 'react';
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
	return (
		<View
			style={[
				styles.badge,
				{
					backgroundColor: isOutlined ? 'transparent' : color.bg,
					borderColor: isOutlined ? color.bg : color.border,
				},
			]}
		>
			<Text
				style={[
					styles.label,
					isOutlined ? undefined : { color: color.fg },
				]}
			>
				{label ?? ''}
			</Text>
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
