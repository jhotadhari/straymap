/**
 * External dependencies
 */
import { StyleSheet } from 'react-native';

/**
 * Internal dependencies
 */
import { OPACITY_DISABLED } from '../../../../constants';

export const sharedStyles = StyleSheet.create({
	noShrink: { flexShrink: 0 },
	row: {
		alignItems: 'center',
		padding: 8,
		flexDirection: 'row', // adjusted dynamically depending on side.
	},
	rowColInfo: {
		flexShrink: 1,
		gap: 8,
		width: '100%',
	},
	rowColInfoRow: {
		flexDirection: 'row', // adjusted dynamically depending on side.
		flexWrap: 'wrap',
		gap: 8,
	},
	disabled: { opacity: OPACITY_DISABLED },
	colorColumnLeft: {
		marginLeft: 2,
		marginRight: -16,
		paddingHorizontal: 8,
		// Fixed total width so the inner bar can grow (under-center
		// highlight) without resizing the column / shifting the row.
		width: 20,
	},
	colorColumnRight: {
		marginLeft: -16,
		paddingHorizontal: 8,
		width: 20,
	},
	colorColumnInner: {
		width: 2,
		height: '100%',
	},
});
