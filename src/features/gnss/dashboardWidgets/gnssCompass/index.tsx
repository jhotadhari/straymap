/**
 * Internal dependencies
 */
import { DashboardWidget } from '../../../dashboard/types';
import AnimatedNavigationIcon from '../AnimatedNavigationIcon';
import Display, { Options } from './Display';
import Control from './Control';

export default {
	key: 'gnssCompass',
	label: 'gnss.gnssCompass',
	Display,
	Control,
	Icon: AnimatedNavigationIcon,
	defaultMinWidth: 80,
} as DashboardWidget<Options>;
