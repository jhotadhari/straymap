/**
 * External dependencies
 */
import React, { FC } from 'react';
import LucideIcons from '@react-native-vector-icons/lucide/static';

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
		<LucideIcons
			color={color}
			size={size-2.5}
			name="mountain"
		/>
	);
};

export default {
	key: 'centerAltitude',
	label: 'dashboard.centerAltitude',
	Display,
	Control,
	Icon,
	shouldSetHgtDirPath: true,
	defaultMinWidth: 75,
} as DashboardWidget<Options>;
