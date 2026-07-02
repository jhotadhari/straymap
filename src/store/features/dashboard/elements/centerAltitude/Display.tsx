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
import { selectMapUpdateInterval, selectUnitPrefs } from '../../../general/selectors';
import { useAppSelector } from '../../../../hooks';
import { DashboardElementProps } from '../../types';
import { UnitPref } from '../../../general/types';
import useItemStyle from '../../hooks/useItemStyle';

export interface Options {
	unitPref?: UnitPref;
}

/** Minimum lng/lat change (degrees) that counts as "moved" for re-query. */
const CENTER_CHANGE_THRESHOLD = 0.0005;

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

	// Track the last center we queried elevation for, to avoid redundant
	// TurboModule calls while the map is stationary.
	const lastQueriedRef = useRef<[number, number] | null>(null);

	// Poll the map-event ref for the latest center + altitude at the
	// map-update rate. This keeps the display responsive during movement.
	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	useEffect(() => {
		intervalRef.current = setInterval(() => {
			const center = currentMapEventRef?.current?.center;
			if (!center) {
				setAltitudeM(null);
				return;
			}
			const lng = center[0];
			const lat = center[1];
			const alt = center[2];
			if (lng == null || lat == null) {
				setAltitudeM(null);
				return;
			}
			// If the native event already carries altitude, use it directly
			// (fast path — may be non-null in future library versions).
			if (alt != null) {
				setAltitudeM(alt);
				return;
			}
		}, mapUpdateInterval);
		return () => {
			intervalRef.current && clearInterval(intervalRef.current);
		};
	}, [mapUpdateInterval, currentMapEventRef]);

	// When the center lands on a new position, call getAltitudeAtPosition
	// (TurboModule, Native Modules thread — never the render thread).
	// Debounced: only fires after the map has been still for 300ms.
	const debounceRef = useRef<NodeJS.Timeout | null>(null);
	const queryAltitude = useCallback(
		(lng: number, lat: number) => {
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

	// Watch center changes and trigger a debounced elevation lookup when
	// the map settles on a new position.
	const prevCenterRef = useRef<[number, number] | null>(null);
	useEffect(() => {
		const timer = setInterval(() => {
			const center = currentMapEventRef?.current?.center;
			if (!center) return;
			const lng = center[0];
			const lat = center[1];
			if (lng == null || lat == null) return;
			// Skip if altitude already provided by the native event.
			if (center[2] != null) return;

			const prev = prevCenterRef.current;
			if (
				!prev ||
				Math.abs(lng - prev[0]) > CENTER_CHANGE_THRESHOLD ||
				Math.abs(lat - prev[1]) > CENTER_CHANGE_THRESHOLD
			) {
				prevCenterRef.current = [lng, lat];
				queryAltitude(lng, lat);
			}
		}, mapUpdateInterval);
		return () => {
			clearInterval(timer);
			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
				debounceRef.current = null;
			}
		};
	}, [mapUpdateInterval, currentMapEventRef, queryAltitude]);

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
