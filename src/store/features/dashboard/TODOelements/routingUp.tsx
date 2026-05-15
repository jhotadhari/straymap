/**
 * External dependencies
 */
import React, { useContext } from 'react';
import { Icon, Text } from 'react-native-paper';
import { get } from 'lodash-es';
import { View } from 'react-native';

/**
 * Internal dependencies
 */
import { DashboardElementProps } from '../../types';
import { RoutingContext } from '../../../../../Context';
import { selectDashboardStyle } from '../../selectors';
import { useAppSelector } from '../../../../hooks';

const Display = ({ dashboardElement, style = {} }: DashboardElementProps) => {
	const dashboardStyle = useAppSelector(selectDashboardStyle);
	let fontSize = get(dashboardElement, ['style', 'fontSize'], 'default');
	fontSize = 'default' === fontSize ? dashboardStyle.fontSize : fontSize;

	const { isRouting, stats } = useContext(RoutingContext);

	return isRouting ? (
		<View
			style={{
				minWidth: get(dashboardElement, ['style', 'minWidth'], undefined),
				flexDirection: 'row',
				alignItems: 'center',
				...style,
			}}
		>
			<Icon
				source="arrow-up"
				size={17}
			/>
			<Text style={{ marginLeft: 5, fontSize }}>{Math.round(stats?.up || 0) + ' m'}</Text>
		</View>
	) : null;
};

export default {
	key: 'routingUp',
	label: 'routingUp', // ???
	Display,
	defaultMinWidth: 75,
};
