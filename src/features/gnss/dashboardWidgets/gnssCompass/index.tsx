/**
 * Internal dependencies
 */
import { DashboardWidget } from '../../../dashboard/types';
import AnimatedNavigationIcon from '../AnimatedNavigationIcon';
import Display, { Options } from './Display';
import Control from './Control';

export default {
	key: 'gnssCompass',
	category: 'sensor',
	label: 'gnss.gnssCompass',
	desc: 'gnss.desc.gnssCompass',
	Display,
	Control,
	Icon: AnimatedNavigationIcon,
	defaultMinWidth: 80,
} as DashboardWidget<Options>;
