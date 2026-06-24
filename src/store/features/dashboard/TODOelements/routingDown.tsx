/**
 * External dependencies
 */
import React, { useContext, useMemo } from 'react';
import { Icon, Text } from 'react-native-paper';
import { get } from 'lodash-es';
import { View } from 'react-native';

/**
 * Internal dependencies
 */
import { RoutingContext } from '../../../../../Context';
import { DashboardElementProps } from '../../types';
import { useAppSelector } from '../../../../hooks';
import { selectDashboardStyle } from '../../selectors';

const Display = ({ dashboardElement, style = {} }: DashboardElementProps) => {
	const dashboardStyle = useAppSelector(selectDashboardStyle);
	let fontSize = get(dashboardElement, ['style', 'fontSize'], 'default');
	fontSize = 'default' === fontSize ? dashboardStyle.fontSize : fontSize;

	const { isRouting, stats } = useContext(RoutingContext);

	const viewStyle = useMemo(
		() => ({
			minWidth: get(dashboardElement, ['style', 'minWidth'], undefined),
			flexDirection: 'row' as const,
			alignItems: 'center' as const,
			...style,
		}),
		[dashboardElement, style]
	);
	const textStyle = useMemo(() => ({ marginLeft: 5, fontSize }), [fontSize]);

	return isRouting ? (
		<View style={viewStyle}>
			<Icon
				source="arrow-down"
				size={17}
			/>
			<Text style={textStyle}>{Math.round(stats?.down || 0) + ' m'}</Text>
		</View>
	) : null;
};

export default {
	key: 'routingDown',
	label: 'routingDown', // ???
	Display,
	defaultMinWidth: 75,
};
