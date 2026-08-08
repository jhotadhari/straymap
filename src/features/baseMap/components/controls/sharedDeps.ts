/**
 * External dependencies
 */
import { StyleSheet } from 'react-native';

export const sharedStyles = StyleSheet.create({
	itemsNone: { marginLeft: 18, marginBottom: 35 },
	controls: {
		justifyContent: 'space-between',
		flexDirection: 'row',
		marginBottom: 25,
		marginRight: 20,
	},
	grid: {
		marginLeft: -40, // revert paper paddingLeft 40
	},
	item: {
		justifyContent: 'space-between',
		alignItems: 'center',
		flexDirection: 'row',
		overflow: 'hidden',
		paddingLeft: 24,
		paddingRight: 14,
	},
	itemReverse: {
		justifyContent: 'space-between',
		alignItems: 'center',
		flexDirection: 'row-reverse',
		overflow: 'hidden',
		paddingLeft: 12,
		paddingRight: 24,
	},
});
