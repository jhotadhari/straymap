/**
 * External dependencies
 */
import type { ComponentProps } from 'react';
import MaterialIcons from '@react-native-vector-icons/material-icons/static';

/**
 * Internal dependencies
 */
import type { DashboardCategory } from '../../../dashboard/types';

export interface TrackingStatDef {
	key: string;
	category: DashboardCategory;
	label: string;
	desc: string;
	iconName: ComponentProps<typeof MaterialIcons>['name'];
	defaultMinWidth: number;
}

const STATS: TrackingStatDef[] = [
	{
		key: 'trackingDistance',
		category: 'tracking',
		label: 'trackRecording.trackingDistance',
		desc: 'trackRecording.desc.trackingDistance',
		iconName: 'route',
		defaultMinWidth: 100,
	},
	{
		key: 'trackingDuration',
		category: 'tracking',
		label: 'trackRecording.trackingDuration',
		desc: 'trackRecording.desc.trackingDuration',
		iconName: 'timer',
		defaultMinWidth: 80,
	},
	{
		key: 'trackingUphill',
		category: 'tracking',
		label: 'trackRecording.trackingUphill',
		desc: 'trackRecording.desc.trackingUphill',
		iconName: 'trending-up',
		defaultMinWidth: 80,
	},
	{
		key: 'trackingDownhill',
		category: 'tracking',
		label: 'trackRecording.trackingDownhill',
		desc: 'trackRecording.desc.trackingDownhill',
		iconName: 'trending-down',
		defaultMinWidth: 80,
	},
	{
		key: 'trackingAvgSpeed',
		category: 'tracking',
		label: 'trackRecording.trackingAvgSpeed',
		desc: 'trackRecording.desc.trackingAvgSpeed',
		iconName: 'multiline-chart',
		defaultMinWidth: 80,
	},
	{
		key: 'trackingPointCount',
		category: 'tracking',
		label: 'trackRecording.trackingPointCount',
		desc: 'trackRecording.desc.trackingPointCount',
		iconName: 'format-list-numbered',
		defaultMinWidth: 60,
	},
];

export default STATS;
