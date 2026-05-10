/**
 * External dependencies
 */
import React, { useContext, useEffect, useRef, useState } from 'react';
import { Text } from 'react-native-paper';
import { get } from 'lodash-es';
import { View } from 'react-native';

/**
 * Internal dependencies
 */
import { MapContext } from '../../../Context';
import { MapEventResponse } from 'react-native-mapsforge-vtm';
import { DashboardDisplayComponentProps } from '../../../store/features/dashboard/types';
import { selectMapEventRate } from '../../../store/features/general/selectors';
import { useAppSelector } from '../../../store/hooks';

const DisplayComponent = ({
	dashboardElement,
	style = {},
	dashboardStyle,
}: DashboardDisplayComponentProps) => {
	const { currentMapEventRef } = useContext(MapContext);

	const mapEventRate = useAppSelector(selectMapEventRate);

	const [zoomLevel, setZoomLevel] = useState<MapEventResponse['zoomLevel']>(undefined);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	useEffect(() => {
		intervalRef.current = setInterval(() => {
			setZoomLevel(currentMapEventRef?.current?.zoomLevel);
		}, mapEventRate);
		return () => {
			intervalRef.current && clearInterval(intervalRef.current);
		};
	}, []);

	let fontSize = get(dashboardElement, ['style', 'fontSize'], 'default');
	fontSize = 'default' === fontSize ? dashboardStyle.fontSize : fontSize;

	return (
		<View
			style={{
				minWidth: get(dashboardElement, ['style', 'minWidth'], undefined),
				...style,
			}}
		>
			{zoomLevel && (
				<Text
					style={{
						fontSize,
					}}
				>
					{zoomLevel}
				</Text>
			)}
		</View>
	);
};

export default {
	key: 'zoomLevel',
	label: 'zoomLevel',
	DisplayComponent,
	ControlComponent: null,
	hasStyleControl: true,
	defaultMinWidth: 75,
	responseInclude: { zoomLevel: 2 },
};
