/**
 * External dependencies
 */
import React, { FC } from 'react';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

/**
 * Internal dependencies
 */
import { DashboardElement } from '../../types';
import Control from './Control';
import Display, { Options } from './Display';

const Icon: FC<{
	color: string;
	size: number;
}> = ({ color, size }) => {
	return (
		<MaterialIcons
			color={color}
			size={size}
			name="compass-calibration"
		/>
	);
	// return (
	// 	<Icon
	// 		source={'cog'}
	// 		size={size}
	// 		color={color}
	// 	/>
	// );
};

export default {
	key: 'centerCoordinates',
	label: 'centerCoordinates',
	Display,
	Control,
	Icon,
	hasStyleControl: true,
	defaultMinWidth: 200,
	responseInclude: { center: 2 },
} as DashboardElement<Options>;
