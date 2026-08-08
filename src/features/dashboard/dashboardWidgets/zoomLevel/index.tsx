/**
 * External dependencies
 */
import { FC } from 'react';
import MaterialIcons from '@react-native-vector-icons/material-icons/static';

/**
 * Internal dependencies
 */
import { DashboardWidget } from '../../types';
import Display, { Options } from './Display';
import Control from './Control';

const Icon: FC<{
	color: string;
	size: number;
}> = ({ color, size }) => {
	return (
		<MaterialIcons
			color={color}
			size={size}
			name="search"
		/>
	);
};

export default {
	key: 'zoomLevel',
	label: 'dashboard.zoomLevel',
	Display,
	Control,
	Icon,
	defaultMinWidth: 75,
} as DashboardWidget<Options>;
