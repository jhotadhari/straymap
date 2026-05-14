/**
 * External dependencies
 */
import React, { FC, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Text } from 'react-native-paper';
import { get } from 'lodash-es';
import { GestureResponderEvent, TouchableHighlight, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

/**
 * Internal dependencies
 */
import { MapContext } from '../../../../Context';
import { MapEventResponse } from 'react-native-mapsforge-vtm';
import { DashboardElement, DashboardElementProps, DashboardItemOptionsBase } from '../types';
import { selectMapEventRate } from '../../general/selectors';
import { useAppSelector } from '../../../hooks';
import { selectDashboardStyle } from '../selectors';

interface Options extends DashboardItemOptionsBase {}

const Display: FC<DashboardElementProps<Options>> = ({ item, style = {}, onPress }) => {
	const handlePress = useMemo(() => {
		if (onPress) {
			return (event: GestureResponderEvent) => onPress(item.key, event);
		}
	}, [
		onPress,
		item.key,
	]);

	const dashboardStyle = useAppSelector(selectDashboardStyle);
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

	const fontSize = item?.options?.fontSize ?? dashboardStyle.fontSize;

	return (
		<TouchableHighlight onPress={handlePress}>
			<View
				style={{
					minWidth: get(item, ['style', 'minWidth'], undefined),
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
		</TouchableHighlight>
	);
};

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
	label: 'zoomLevel',
	Display,
	Control: undefined,
	Icon,
	hasStyleControl: true,
	defaultMinWidth: 75,
	responseInclude: { zoomLevel: 2 },
} as DashboardElement<Options>;
