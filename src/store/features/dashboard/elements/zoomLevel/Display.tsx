/**
 * External dependencies
 */
import React, { FC, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Text, useTheme } from 'react-native-paper';
import { GestureResponderEvent, TouchableHighlight, View } from 'react-native';
import { MapEventResponse } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../../hooks';
import { selectMapEventRate } from '../../../general/selectors';
import { DashboardElementProps } from '../../types';
import { MapContext } from '../../../../../Context';
import useItemStyle from '../../hooks/useItemStyle';

export interface Options {}

const Display: FC<DashboardElementProps<Options>> = ({ item, style = {}, onPress }) => {
	const handlePress = useMemo(() => {
		if (onPress) {
			return (event: GestureResponderEvent) => onPress(item.key, event);
		}
	}, [onPress, item.key]);

	const theme = useTheme();

	const { currentMapEventRef } = useContext(MapContext);
	const mapEventRate = useAppSelector(selectMapEventRate);

	const { fontSize, minWidth, textAlign } = useItemStyle(item);

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

	return (
		<TouchableHighlight
			underlayColor={theme.colors.primaryContainer}
			onPress={handlePress}
		>
			<View style={[{ minWidth }, style]}>
				{zoomLevel && (
					<Text
						style={{
							fontSize,
							textAlign,
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
