/**
 * External dependencies
 */
import React, { FC } from 'react';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

/**
 * Internal dependencies
 */
import {
	DashboardElement,
} from '../../types';
import ControlComponent from './ControlComponent';
import DisplayComponent, { Options } from './DisplayComponent';

const IconComponent: FC<{
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
	DisplayComponent,
	ControlComponent,
	IconComponent,
	hasStyleControl: true,
	defaultMinWidth: 200,
	responseInclude: { center: 2 },
} as DashboardElement<Options>;
