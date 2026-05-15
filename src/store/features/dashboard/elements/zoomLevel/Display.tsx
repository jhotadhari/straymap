/**
 * External dependencies
 */
import React, { FC, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Text } from 'react-native-paper';
import { get } from 'lodash-es';
import { GestureResponderEvent, TouchableHighlight, View } from 'react-native';
import { MapEventResponse } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
*/
import { useAppSelector } from '../../../../hooks';
import { selectMapEventRate } from '../../../general/selectors';
import { selectDashboardStyle } from '../../selectors';
import { DashboardElementProps } from '../../types';
import { MapContext } from '../../../../../Context';
import * as elements from '../../elements';

export interface Options {}

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

	const fontSize = item?.fontSize ?? dashboardStyle.fontSize;

		const minWidth = useMemo(
			() => item?.minWidth ?? get(elements, [item?.elementType || '', 'defaultMinWidth'], 75),
			[item?.minWidth, item?.elementType]
		);

	return (
		<TouchableHighlight onPress={handlePress}>
			<View
				style={[
					{ minWidth },
					style,
				]}
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

export default Display;