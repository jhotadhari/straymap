/**
 * External dependencies
 */
import React, { FC } from 'react';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

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
	return (
		<MaterialIcons
			color={color}
			size={size}
			name="photo"
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
	key: 'centerAltitude',
	label: 'centerAltitude',
	Display,
	Control,
	Icon,
	shouldSetHgtDirPath: true,
	defaultMinWidth: 75,
	responseInclude: { center: 2 },
} as DashboardElement<Options>;
