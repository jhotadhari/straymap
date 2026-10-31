/**
 * External dependencies
 */
import type { ComponentProps } from 'react';
import MaterialIcons from '@react-native-vector-icons/material-icons/static';

/**
 * Internal dependencies
 */

export interface TrackingStatDef {
	key: string;
	label: string;
	iconName: ComponentProps<typeof MaterialIcons>['name'];
	defaultMinWidth: number;
}

const STATS: TrackingStatDef[] = [
	{
		key: 'trackingDistance',
		label: 'trackRecording.trackingDistance',
		iconName: 'route',
		defaultMinWidth: 100,
	},
	{
		key: 'trackingDuration',
		label: 'trackRecording.trackingDuration',
		iconName: 'timer',
		defaultMinWidth: 80,
	},
	{
		key: 'trackingUphill',
		label: 'trackRecording.trackingUphill',
		iconName: 'trending-up',
		defaultMinWidth: 80,
	},
	{
		key: 'trackingDownhill',
		label: 'trackRecording.trackingDownhill',
		iconName: 'trending-down',
		defaultMinWidth: 80,
	},
	{
		key: 'trackingSpeed',
		label: 'trackRecording.trackingSpeed',
		iconName: 'speed',
		defaultMinWidth: 80,
	},
	{
		key: 'trackingAvgSpeed',
		label: 'trackRecording.trackingAvgSpeed',
		iconName: 'multiline-chart',
		defaultMinWidth: 80,
	},
	{
		key: 'trackingPointCount',
		label: 'trackRecording.trackingPointCount',
		iconName: 'format-list-numbered',
		defaultMinWidth: 60,
	},
];

export default STATS;
