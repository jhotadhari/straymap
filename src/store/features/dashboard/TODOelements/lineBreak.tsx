/**
 * External dependencies
 */
import React from 'react';
import { View } from 'react-native';

/**
 * Internal dependencies
*/
import { DashboardElementProps } from '../types';

const DisplayComponent = ({ style = {} }: DashboardElementProps) => {
	return (
		<View
			style={{
				width: '100%',
				height: 0,
				...style,
			}}
		/>
	);
};

export default {
	key: 'lineBreak',
	label: 'lineBreak',
	DisplayComponent,
	ControlComponent: null,
	hasStyleControl: false,
	defaultMinWidth: 75,
	responseInclude: {},
};
