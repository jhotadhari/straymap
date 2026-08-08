/**
 * External dependencies
 */
import React, { FC } from 'react';
import MaterialIcons from '@react-native-vector-icons/material-icons/static';

/**
 * Internal dependencies
 */
import { DashboardWidget } from '../../../dashboard/types';
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
			name="my-location"
		/>
	);
};

export default {
	key: 'gnssCoordinates',
	label: 'gnss.gnssCoordinates',
	Display,
	Control,
	Icon,
	defaultMinWidth: 250,
} as DashboardWidget<Options>;
