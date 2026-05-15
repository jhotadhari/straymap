/**
 * External dependencies
 */
import React, { FC, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Text } from 'react-native-paper';
import { get } from 'lodash-es';
import { GestureResponderEvent, TouchableHighlight, View } from 'react-native';
import convertUnits from 'convert-units';

/**
 * Internal dependencies
 */
import { roundTo } from '../../../../../lib/utilsGeneral';
import { MapContext } from '../../../../../Context';
import { selectMapEventRate, selectUnitPrefs } from '../../../general/selectors';
import { useAppSelector } from '../../../../hooks';
import { DashboardElementProps } from '../../types';
import { UnitPref } from '../../../general/types';
import { selectDashboardStyle } from '../../selectors';

export interface Options {
	unitPref?: UnitPref;
}

const formatOutput = (altitudeM: number | null, unit: UnitPref): string => {
	if (null === altitudeM) {
		return '-';
	}


	console.log( 'debug altitudeM', altitudeM, unit.round ); // debug



	switch (unit.unit) {
		case 'ft':
			return roundTo(convertUnits(altitudeM).from('m').to('ft'), unit.round) + ' ft';
		case 'fath':
			return roundTo(altitudeM * 0.5468066492, unit.round) + ' fathom';
		default:
			return roundTo(altitudeM, unit.round) + ' m';
	}
};

const Display: FC<DashboardElementProps<Options>> = ({ item, style = {}, onPress }) => {
	const handlePress = useMemo(() => {
		if (onPress) {
			return (event: GestureResponderEvent) => onPress(item.key, event);
		}
	}, [
		onPress,
		item.key,
	]);

	const mapEventRate = useAppSelector(selectMapEventRate);
	const dashboardStyle = useAppSelector(selectDashboardStyle);
	const unitPrefs = useAppSelector(selectUnitPrefs);

	const { currentMapEventRef } = useContext(MapContext);

	const unitPref: UnitPref = useMemo(
		() => ({
			...get(unitPrefs, ['heightDepth']),
			...item?.options?.unitPref,
		}),
		[item, unitPrefs]
	);

	const fontSize = item?.fontSize ?? dashboardStyle.fontSize;

	const [altitudeM, setAltitudeM] = useState<number | null>(null);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	useEffect(() => {
		intervalRef.current = setInterval(() => {
			setAltitudeM(currentMapEventRef?.current?.center?.alt || null);
		}, mapEventRate);
		return () => {
			intervalRef.current && clearInterval(intervalRef.current);
		};
	}, [mapEventRate]);

	return (
		<TouchableHighlight onPress={handlePress}>
			<View
				style={[
					{
						minWidth: get(item, ['style', 'minWidth'], undefined),
					},
					style,
				]}
			>
				<Text
					style={{
						fontSize,
					}}
				>
					{formatOutput(altitudeM, unitPref)}
				</Text>
			</View>
		</TouchableHighlight>
	);
};

export default Display;
