/**
 * External dependencies
 */
import React, { FC, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
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
import { useAppSelector } from '../../../../hooks';
import { DashboardElementProps } from '../../types';
import { UnitPref } from '../../../general/types';
import useItemStyle from '../../hooks/useItemStyle';

export interface Options {
	unitPref?: UnitPref;
}

/** Minimum lng/lat change (degrees) that triggers a re-query. */
const CENTER_CHANGE_THRESHOLD = 0.0005;

/**
 * Center-altitude dashboard element.
 *
 * Reads the map center from useMapPosition()'s shared value (zero bridge
 * crossings). When the map settles, calls getAltitudeAtPosition() — a
 * TurboModule that runs on the Native Modules thread, never blocking
 * rendering.
 */
const Display: FC<DashboardElementProps<Options>> = ({ item, style = {}, onPress }) => {
	const handlePress = useMemo(() => {
		if (onPress) {
			return (event: GestureResponderEvent) => onPress(item.key, event);
		}
	}, [onPress, item.key]);

	const theme = useTheme();

	const unitPrefs = useAppSelector((state) => get(state, ['general', 'unitPrefs']));

	const { fontSize, minWidth, textAlign } = useItemStyle(item);

	const { centerPositionSvRef } = useContext(MapContext);
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
	const lastQueriedRef = useRef<[number, number] | null>(null);
	const debounceRef = useRef<NodeJS.Timeout | null>(null);

	const queryAltitude = useCallback(
		(lng: number, lat: number) => {
			// Skip if we already queried this exact position.
			const prev = lastQueriedRef.current;
			if (
				prev &&
				Math.abs(lng - prev[0]) < CENTER_CHANGE_THRESHOLD &&
				Math.abs(lat - prev[1]) < CENTER_CHANGE_THRESHOLD
			) {
				return;
			}
			lastQueriedRef.current = [lng, lat];

			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}
			debounceRef.current = setTimeout(() => {
				debounceRef.current = null;
				getAltitudeAtPosition(lng, lat).then((alt) => {
					if (alt != null) {
						setAltitudeM(alt);
					}
				});
			}, 300);
		},
		[getAltitudeAtPosition]
	);

	// Poll the shared value for the current center. SharedValue.value reads
	// are fast (no bridge) — much cheaper than a bridge-event callback.
	useEffect(() => {
		const timer = setInterval(() => {
			const center = centerPositionSvRef.current?.value;
			if (!center || center[0] == null || center[1] == null) {
				return;
			}
			queryAltitude(center[0], center[1]);
		}, 200);
		return () => {
			clearInterval(timer);
			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
				debounceRef.current = null;
			}
		};
	}, [centerPositionSvRef, queryAltitude]);

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
