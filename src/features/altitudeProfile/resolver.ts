/**
 * Internal dependencies
 */
import { BottomDrawerItem } from '../bottomDrawer/types';
import { setBottomDrawerItemResolver } from '../bottomDrawer/dynamicItems';
import { ALTITUDE_PROFILE_KEY_PREFIX } from './types';
import AltitudeProfileDisplay from './components/AltitudeProfileDisplay';

export const registerAltitudeProfileItemResolver = (): void => {
	setBottomDrawerItemResolver((key: string): BottomDrawerItem | undefined => {
		if (!key.startsWith(ALTITUDE_PROFILE_KEY_PREFIX)) {
			return undefined;
		}
		return {
			key,
			iconSource: 'chart-areaspline-variant',
			DisplayComponent: AltitudeProfileDisplay,
		};
	});
};
