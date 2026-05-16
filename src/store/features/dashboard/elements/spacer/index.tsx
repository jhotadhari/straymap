/**
 * External dependencies
 */
import React, { FC } from 'react';
import { Icon as IconPaper } from 'react-native-paper';

/**
 * Internal dependencies
 */
import { DashboardElement } from '../../types';
import Display, { Options } from './Display';
import Control from './Control';

const Icon: FC<{
	color: string;
	size: number;
}> = ({ color, size }) => {
	// return (
	// 	<MaterialIcons
	// 		color={color}
	// 		size={size}
	// 		name="photo"
	// 	/>
	// );
	return (
		<IconPaper
			source={'keyboard-space'}
			size={size}
			color={color}
		/>
	);
};

export default {
	key: 'spacer',
	label: 'dashboard.spacer',
	Display,
	Control,
	Icon,
	defaultMinWidth: 75,
} as DashboardElement<Options>;
