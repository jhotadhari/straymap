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
			name="terrain"
		/>
	);
};

export default {
	key: 'gpsAltitude',
	label: 'gnss.gpsAltitude',
	Display,
	Control,
	Icon,
	defaultMinWidth: 75,
	responseInclude: { center: 3 },
} as DashboardElement<Options>;
