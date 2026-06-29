/**
 * Internal dependencies
 */
import { DRAWER_WIDTH } from './constants';

export const getDrawerWidthResponsive = (windowWidth: number) => {
	return DRAWER_WIDTH <= (windowWidth * 2) / 3 ? DRAWER_WIDTH : (windowWidth * 2) / 3;
};
