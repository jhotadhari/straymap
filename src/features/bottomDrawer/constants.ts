/**
 * Internal dependencies
 */
import { DRAWER_ICON_SIZE } from '../../constants';

export { DRAWER_ICON_SIZE };
export const BOTTOM_DRAWER_ICON_SIZE = DRAWER_ICON_SIZE;

export const BOTTOM_DRAWER_HANDLE_HEIGHT = 50;
export const BOTTOM_DRAWER_HANDLE_WIDTH = 50;
export const BOTTOM_DRAWER_CONTENT_HEIGHT = 300;

/**
 * Debug colors so every region of the bottom drawer is clearly visible in any
 * theme. Replace/strip once the layout is settled.
 */
export const BOTTOM_DRAWER_DEBUG = {
	handleInactiveBg: '#003DF5',
	handleActiveBg: '#7AF500',
	handleBorder: '#F5B800',
	handleIcon: '#FFFFFF',
	handleIconActive: '#1A1A1A',
	content: '#00F5B8',
};
