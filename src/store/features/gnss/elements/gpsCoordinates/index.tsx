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
			name="my-location"
		/>
	);
};

export default {
	key: 'gpsCoordinates',
	label: 'gnss.gpsCoordinates',
	Display,
	Control,
	Icon,
	defaultMinWidth: 250,
	responseInclude: { center: 2 },
} as DashboardElement<Options>;
