/**
 * External dependencies
 */
import React, { FC, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Icon, Menu, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { upperFirst, get, set } from 'lodash-es';
import { GestureResponderEvent, TouchableHighlight, View } from 'react-native';
import formatcoords from 'formatcoords';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

/**
 * Internal dependencies
 */
import ButtonHighlight from '../../../../../components/generic/ButtonHighlight';
import MenuItem from '../../../../../components/generic/MenuItem';
import InfoRowControl from '../../../../../components/generic/controls/InfoRowControl';
import { NumericRowControl } from '../../../../../components/generic/controls/NumericRowControls';
import { options as unitPrefControlOptions } from '../../../general/components/controls/UnitPrefControl';
import { MapContext } from '../../../../../Context';
import { useAppSelector } from '../../../../hooks';
import { selectMapEventRate, selectUnitPrefs } from '../../../general/selectors';
import {
	DashboardElementProps,
	DashboardElement,
	DashboardItemOptionsBase,
} from '../../types';
import { UnitPref } from '../../../general/types';
import { selectDashboardStyle } from '../../selectors';
import ControlComponent from './ControlComponent';

export interface Options extends DashboardItemOptionsBase {
	unitPref?: UnitPref;
}

const DisplayComponent: FC<DashboardElementProps<Options>> = ({ item, style = {}, onPress }) => {
	const handlePress = useMemo(() => {
		if (onPress) {
			return (event: GestureResponderEvent) => onPress(item.key, event);
		}
	}, [
		onPress,
		item.key,
	]);

	const dashboardStyle = useAppSelector(selectDashboardStyle);
	const unitPrefs = useAppSelector(selectUnitPrefs);
	const { currentMapEventRef } = useContext(MapContext);

	const mapEventRate = useAppSelector(selectMapEventRate);

	const [centerLng, setCenterLng] = useState<number | undefined>(undefined);
	const [centerLat, setCenterLat] = useState<number | undefined>(undefined);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	useEffect(() => {
		intervalRef.current = setInterval(() => {
			setCenterLng(currentMapEventRef?.current?.center?.lng);
			setCenterLat(currentMapEventRef?.current?.center?.lat);
		}, mapEventRate);
		return () => {
			intervalRef.current && clearInterval(intervalRef.current);
		};
	}, []);

	const unitPref = item?.options?.unitPref ?? get(unitPrefs, 'coordinates');

	const fontSize = item?.options?.fontSize ?? dashboardStyle.fontSize;

	return (
		<TouchableHighlight onPress={handlePress}>
			<View
				style={{
					minWidth: get(item, ['style', 'minWidth'], undefined),
					...style,
				}}
			>
				{undefined !== centerLng && undefined !== centerLat && (
					<Text
						style={{
							fontSize,
						}}
					>
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
								unitPref.unit,
								'f'
							),
							{
								decimalPlaces: unitPref.round,
							}
						)}
					</Text>
				)}
			</View>
		</TouchableHighlight>
	);
};

export default DisplayComponent;