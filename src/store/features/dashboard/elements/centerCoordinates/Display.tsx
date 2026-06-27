/**
 * External dependencies
 */
import React, { FC, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Text, useTheme } from 'react-native-paper';
import { get } from 'lodash-es';
import { GestureResponderEvent, TouchableHighlight, View } from 'react-native';
import formatcoords from 'formatcoords';

/**
 * Internal dependencies
 */
import { MapContext } from '../../../../../Context';
import { useAppSelector } from '../../../../hooks';
import { selectMapEventRate, selectUnitPrefs } from '../../../general/selectors';
import { DashboardElementProps } from '../../types';
import { UnitPref } from '../../../general/types';
import useItemStyle from '../../hooks/useItemStyle';

export interface Options {
	unitPref?: Partial<UnitPref>;
}

const Display: FC<DashboardElementProps<Options>> = ({ item, style = {}, onPress }) => {
	const handlePress = useMemo(() => {
		if (onPress) {
			return (event: GestureResponderEvent) => onPress(item.key, event);
		}
	}, [onPress, item.key]);

	const theme = useTheme();

	const unitPrefs = useAppSelector(selectUnitPrefs);
	const { currentMapEventRef } = useContext(MapContext);

	const { fontSize, minWidth, textAlign } = useItemStyle(item);

	const mapEventRate = useAppSelector(selectMapEventRate);

	const [centerLng, setCenterLng] = useState<number | undefined>(undefined);
	const [centerLat, setCenterLat] = useState<number | undefined>(undefined);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	useEffect(() => {
		intervalRef.current = setInterval(() => {
			setCenterLng(currentMapEventRef?.current?.center?.[0]);
			setCenterLat(currentMapEventRef?.current?.center?.[1]);
		}, mapEventRate);
		return () => {
			intervalRef.current && clearInterval(intervalRef.current);
		};
	}, [currentMapEventRef, mapEventRate]);

	const unit = item?.options?.unitPref?.unit ?? get(unitPrefs, ['coordinates', 'unit']);
	const round = item?.options?.unitPref?.round ?? get(unitPrefs, ['coordinates', 'round']);

	const viewStyle = useMemo(() => [{ minWidth }, style], [minWidth, style]);
	const textStyle = useMemo(() => ({ fontSize, textAlign }), [fontSize, textAlign]);

	return (
		<TouchableHighlight
			underlayColor={theme.colors.primaryContainer}
			onPress={handlePress}
		>
			<View style={viewStyle}>
				{undefined !== centerLng && undefined !== centerLat && (
					<Text style={textStyle}>
						{formatcoords({
							lng: centerLng,
							lat: centerLat,
						}).format(
							get(
								{
									// https://www.npmjs.com/package/formatcoords#user-content-formatting
									dd: 'f',
									dmm: 'Ff',
									dms: 'FFf',
								},
								unit,
								'f'
							),
							{
								decimalPlaces: Math.min(round, 99),
							}
						)}
					</Text>
				)}
			</View>
		</TouchableHighlight>
	);
};

export default Display;
