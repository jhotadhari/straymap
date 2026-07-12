/**
 * External dependencies
 */
import { StyleSheet } from 'react-native';

/**
 * Internal dependencies
 */
import { DRAWER_ICON_SIZE } from '../../constants';

export { DRAWER_ICON_SIZE };
export const DRAWER_WIDTH = 300;
export const DRAWER_HANDLE_SIZE = 50;

export const itemStyles = StyleSheet.create({
	item: {
		gap: (DRAWER_HANDLE_SIZE - DRAWER_ICON_SIZE) / 4,
		top: -(DRAWER_HANDLE_SIZE - DRAWER_ICON_SIZE) / 3,
	},
	buttonRow: {
		marginVertical: (DRAWER_HANDLE_SIZE - DRAWER_ICON_SIZE) / 2,
		marginHorizontal: 16,
		gap: 8,
	},
	itemRow: {
		marginBottom: (DRAWER_HANDLE_SIZE - DRAWER_ICON_SIZE) / 4,
	},
});
