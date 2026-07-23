/**
 * External dependencies
 */
import { StyleSheet } from 'react-native';

/**
 * Internal dependencies
 */
import { OPACITY_DISABLED } from './constants';

export const sharedStyles = StyleSheet.create({
	flexRow: {
		flexDirection: 'row',
	},
	flexRowCenter: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	flex1: {
		flex: 1,
	},
	alignStart: {
		alignItems: 'flex-start',
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
	disabled: {
		opacity: OPACITY_DISABLED,
	},
	gap: {
		gap: 8,
	},
	absolute: {
		position: 'absolute',
		top: 0,
		left: 0,
		bottom: 0,
		right: 0,
	},
});
