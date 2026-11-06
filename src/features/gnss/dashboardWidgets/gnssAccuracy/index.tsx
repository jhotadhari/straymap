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
			name="near-me"
		/>
	);
};

export default {
	key: 'gnssAccuracy',
	category: 'gnss',
	label: 'gnss.gnssAccuracy',
	desc: 'gnss.desc.gnssAccuracy',
	Display,
	Control,
	Icon,
	defaultMinWidth: 100,
} as DashboardWidget<Options>;
