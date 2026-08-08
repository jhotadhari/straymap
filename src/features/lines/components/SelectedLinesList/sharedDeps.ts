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
	},
	colorColumnRight: {
		marginLeft: -16,
		paddingHorizontal: 8,
	},
	colorColumnInner: {
		width: 2,
		flex: 1,
		height: '100%',
	},
});
