/**
 * External dependencies
 */
import React, { FC } from 'react';
import MaterialIcons from '@react-native-vector-icons/material-icons/static';

/**
 * Internal dependencies
 */
import { DashboardElement } from '../../../dashboard/types';
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
			name="gps-fixed"
		/>
	);
};

export default {
	key: 'gpsAccuracy',
	label: 'gnss.gpsAccuracy',
	Display,
	Control,
	Icon,
	defaultMinWidth: 100,
	responseInclude: { center: 2 },
} as DashboardElement<Options>;
