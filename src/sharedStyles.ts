/**
 * External dependencies
 */
import { StyleSheet } from 'react-native';

export const sharedStyles = StyleSheet.create({
	flexRow: {
		flexDirection: 'row',
	},
	flexRowCenter: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	controlIcon: {
		marginLeft: 7,
		marginRight: -7,
		justifyContent: 'center',
	},
	modal: {
		marginTop: 16,
		gap: 24,
	},
	modalControls: {
		marginBottom: 40,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	listItem: {
		marginLeft: 0,
		paddingLeft: 10,
	},
});
