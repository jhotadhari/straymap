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
		justifyContent: 'space-between',
		alignItems: 'center',
		flexDirection: 'row',
		padding: 4,
	},
	rowColCenter: {
		flexShrink: 1,
		gap: 8,
		width: '100%',
	},
	rowColCenterRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
	},
	disabled: { opacity: OPACITY_DISABLED },
});
