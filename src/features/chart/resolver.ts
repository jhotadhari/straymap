/**
 * Internal dependencies
 */
import { BottomDrawerItem } from '../bottomDrawer/types';
import { setBottomDrawerItemResolver } from '../bottomDrawer/dynamicItems';
import { CHART_KEY_PREFIX } from './types';
import ChartDisplay from './components/ChartDisplay';

export const registerChartItemResolver = (): void => {
	setBottomDrawerItemResolver((key: string): BottomDrawerItem | undefined => {
		if (!key.startsWith(CHART_KEY_PREFIX)) {
			return undefined;
		}
		return {
			key,
			iconSource: 'chart-areaspline-variant',
			DisplayComponent: ChartDisplay,
		};
	});
};
