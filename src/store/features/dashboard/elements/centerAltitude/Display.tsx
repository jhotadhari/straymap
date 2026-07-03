/**
 * External dependencies
 */
import React, { FC, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Text, useTheme } from 'react-native-paper';
import { get } from 'lodash-es';
import { GestureResponderEvent, TouchableHighlight, View } from 'react-native';
/**
 * react-native-mapsforge-vtm dependencies
 */
import { useMap } from 'react-native-mapsforge-vtm';
/**
 * Internal dependencies
 */
import { formatHeightDepth } from '../../../../../lib/formatting';
import { AppContext, MapContext } from '../../../../../Context';
import { selectMapUpdateInterval, selectUnitPrefs } from '../../../general/selectors';
import { useAppSelector } from '../../../../hooks';
import { DashboardElementProps } from '../../types';
import { UnitPref } from '../../../general/types';
import useItemStyle from '../../hooks/useItemStyle';

export interface Options {
	unitPref?: UnitPref;
}

const Display: FC<DashboardElementProps<Options>> = ({ item, style = {}, onPress }) => {
	const handlePress = useMemo(() => {
		if (onPress) {
			return (event: GestureResponderEvent) => onPress(item.key, event);
		}
	}, [onPress, item.key]);

	const theme = useTheme();

	const mapUpdateInterval = useAppSelector(selectMapUpdateInterval);
	const unitPrefs = useAppSelector(selectUnitPrefs);

	const { fontSize, minWidth, textAlign } = useItemStyle(item);

	const { currentMapEventRef } = useContext(MapContext);
	const { mapViewNativeNodeHandle } = useContext(AppContext);

	const { getAltitudeAtPosition } = useMap(mapViewNativeNodeHandle ?? null);

	const unitPref: UnitPref = useMemo(
		() => ({
			...get(unitPrefs, ['heightDepth']),
			...item?.options?.unitPref,
		}),
		[item, unitPrefs]
	);

	const [altitudeM, setAltitudeM] = useState<number | null>(null);

	// Read altitude from map-update events at the native event rate.
	// The native getResponseBase does a cached-only lookup (sub-ms on hit,
	// preload on miss) — no render-thread I/O. When the native side has a
	// cache miss, center[2] is null and we fall back to the TurboModule.
	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	useEffect(() => {
		intervalRef.current = setInterval(() => {
			const center = currentMapEventRef?.current?.center;
			if (!center || center[0] == null || center[1] == null) {
				setAltitudeM(null);
				return;
			}
			const alt = center[2];
			if (alt != null) {
				setAltitudeM(alt);
			} else {
				// Native cache miss — fall back to TurboModule.
				// Runs on Native Modules thread, no render impact.
				getAltitudeAtPosition(center[0], center[1]).then((a) => {
					if (a != null) setAltitudeM(a);
				});
			}
		}, mapUpdateInterval);
		return () => {
			intervalRef.current && clearInterval(intervalRef.current);
		};
	}, [mapUpdateInterval, currentMapEventRef, getAltitudeAtPosition]);

	const viewStyle = useMemo(() => [{ minWidth }, style], [minWidth, style]);
	const textStyle = useMemo(() => ({ fontSize, textAlign }), [fontSize, textAlign]);

	return (
		<TouchableHighlight
			underlayColor={theme.colors.primaryContainer}
			onPress={handlePress}
		>
			<View style={viewStyle}>
				<Text style={textStyle}>
					{altitudeM === null ? '-' : formatHeightDepth(altitudeM, unitPref)}
				</Text>
			</View>
		</TouchableHighlight>
	);
};

export default Display;
