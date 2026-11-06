/**
 * External dependencies
 */
import React, { FC } from 'react';
import MaterialIcons from '@react-native-vector-icons/material-icons/static';

/**
 * Internal dependencies
 */
import { DashboardWidget } from '../../../dashboard/types';
import Display from './Display';
import Control from './Control';
import STATS from './STATS';

const createIcon = (
	iconName: React.ComponentProps<typeof MaterialIcons>['name']
): FC<{ color: string; size: number }> => {
	const Icon: FC<{ color: string; size: number }> = ({ color, size }) => {
		return (
			<MaterialIcons
				color={color}
				size={size}
				name={iconName}
			/>
		);
	};
	return Icon;
};

const widgets: DashboardWidget[] = STATS.map((stat) => ({
	key: stat.key,
	category: stat.category,
	label: stat.label,
	desc: stat.desc,
	Display,
	Control,
	Icon: createIcon(stat.iconName),
	defaultMinWidth: stat.defaultMinWidth,
}));

export default widgets;
