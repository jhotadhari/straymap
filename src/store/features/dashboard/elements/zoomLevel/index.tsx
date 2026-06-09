/**
 * External dependencies
 */
import { FC } from 'react';
import { Icon as IconPaper } from 'react-native-paper';
import MaterialIcons from '@react-native-vector-icons/material-icons/static';

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
			name="search"
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
	key: 'zoomLevel',
	label: 'dashboard.zoomLevel',
	Display,
	Control,
	Icon,
	defaultMinWidth: 75,
	responseInclude: { zoomLevel: 2 },
} as DashboardElement<Options>;
