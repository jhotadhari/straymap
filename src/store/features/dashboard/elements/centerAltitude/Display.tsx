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
 * crossings). Calls getAltitudeAtPosition() — a TurboModule on the Native
 * Modules thread — whenever the center changes. After the first call for a
 * tile caches the HGT data, subsequent calls are sub-millisecond cache
 * lookups, so the display tracks movement smoothly.
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

	// Incremented on every query; responses check it to avoid updating
	// the display with a stale value when a newer request is in flight.
	const requestIdRef = useRef(0);

	// Poll the shared value for the current center. SharedValue.value
	// reads are zero bridge crossings — much cheaper than setInterval
	// polling a bridge-event ref.
	useEffect(() => {
		const timer = setInterval(() => {
			const center = centerPositionSvRef.current?.value;
			if (!center || center[0] == null || center[1] == null) {
				return;
			}
			const lng = center[0];
			const lat = center[1];

			const id = ++requestIdRef.current;
			getAltitudeAtPosition(lng, lat).then((alt) => {
				// Only apply if no newer request was made.
				if (requestIdRef.current === id) {
					setAltitudeM(alt);
				}
			});
		}, 200);
		return () => {
			clearInterval(timer);
		};
	}, [centerPositionSvRef, getAltitudeAtPosition]);

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
