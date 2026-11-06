/**
 * External dependencies
 */
import React, { FC } from 'react';
import MaterialIcons from '@react-native-vector-icons/material-icons/static';

/**
 * Internal dependencies
 */
import { DashboardWidget } from '../../../dashboard/types';
import Display, { FollowStatOptions } from '../shared/Display';

const Icon: FC<{ color: string; size: number }> = ({ color, size }) => (
	<MaterialIcons
		color={color}
		size={size}
		name="trending-down"
	/>
);

export default {
	key: 'lineFollowDescentToDestination',
	category: 'following',
	label: 'lineFollow.descentToDestination',
	desc: 'lineFollow.desc.descentToDestination',
	Display,
	Icon,
	defaultMinWidth: 100,
} as DashboardWidget<FollowStatOptions>;
