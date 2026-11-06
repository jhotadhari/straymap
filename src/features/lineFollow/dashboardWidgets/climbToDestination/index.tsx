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
		name="trending-up"
	/>
);

export default {
	key: 'lineFollowClimbToDestination',
	category: 'following',
	label: 'lineFollow.climbToDestination',
	desc: 'lineFollow.desc.climbToDestination',
	Display,
	Icon,
	defaultMinWidth: 100,
} as DashboardWidget<FollowStatOptions>;
