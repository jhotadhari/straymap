/**
 * Internal dependencies
 */
import { DRAWER_ICON_SIZE } from '../../constants';

export { DRAWER_ICON_SIZE };
export const BOTTOM_DRAWER_ICON_SIZE = DRAWER_ICON_SIZE;

export const BOTTOM_DRAWER_HANDLE_HEIGHT = 50;
export const BOTTOM_DRAWER_HANDLE_WIDTH = 50;
export const BOTTOM_DRAWER_CONTENT_HEIGHT = 300;

// Single handle morph: closed = pill, open (>= MORPH_DISTANCE px) = thin grab line.
export const BOTTOM_DRAWER_GRAB_HEIGHT = 10;
export const BOTTOM_DRAWER_GRAB_WIDTH = 72;
export const BOTTOM_DRAWER_MORPH_DISTANCE = 60; // ~20% of content height
export const BOTTOM_DRAWER_TOUCH_AREA_WIDTH = 120;
