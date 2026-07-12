/**
 * External dependencies
 */
import { FC } from 'react';
import { Pressable, View, StyleSheet } from 'react-native';

/**
 * Internal dependencies
 */
import { TAG_COLORS } from '../tagColor';

const ColorPaletteInline: FC<{
	selectedColor: string;
	onSelect: (color: string) => void;
}> = ({ selectedColor, onSelect }) => (
	<View style={styles.colorRow}>
		{TAG_COLORS.map((tc) => (
			<Pressable
				key={tc.bg}
				onPress={() => onSelect(tc.bg)}
				style={[
					styles.colorSwatch,
					{
						backgroundColor: tc.bg,
						borderColor: tc.border,
					},
					selectedColor === tc.bg && styles.colorSwatchSelected,
				]}
			/>
		))}
	</View>
);

const styles = StyleSheet.create({
	colorRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 4,
		marginVertical: 4,
	},
	colorSwatch: {
		borderWidth: 2,
		borderRadius: 14,
		height: 28,
		width: 28,
	},
	colorSwatchSelected: {
		borderWidth: 3,
		height: 30,
		width: 30,
	},
});

export default ColorPaletteInline;
