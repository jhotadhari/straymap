/**
 * External dependencies
 */
import { FC } from 'react';
import { Pressable, View, StyleSheet, ViewProps } from 'react-native';

/**
 * Internal dependencies
 */
import { PALETTE_COLORS } from './palette';

const ColorPaletteInline: FC<{
	selectedColor: string;
	style?: ViewProps['style'];
	onSelect: (color: string) => void;
}> = ({ selectedColor, onSelect, style }) => (
	<View style={[styles.colorRow, style]}>
		{PALETTE_COLORS.map((tc) => {
			const isSelected = selectedColor === tc.bg;
			return (
				<Pressable
					key={tc.bg}
					onPress={() => onSelect(tc.bg)}
					style={[
						styles.swatchRing,
						isSelected && {
							borderColor: tc.border,
						},
					]}
				>
					<View
						style={[
							styles.colorSwatch,
							{ backgroundColor: tc.bg },
						]}
					/>
				</Pressable>
			);
		})}
	</View>
);

const SWATCH_SIZE = 24;
const RING_PADDING = 3;
const RING_BORDER = 2;

const styles = StyleSheet.create({
	colorRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
		marginVertical: 4,
	},
	swatchRing: {
		padding: RING_PADDING,
		borderRadius: SWATCH_SIZE / 2 + RING_PADDING + RING_BORDER,
		borderWidth: RING_BORDER,
		borderColor: 'transparent',
	},
	colorSwatch: {
		borderRadius: SWATCH_SIZE / 2,
		height: SWATCH_SIZE,
		width: SWATCH_SIZE,
	},
});

export default ColorPaletteInline;
