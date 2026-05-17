/**
 * External dependencies
 */
import React, {  } from 'react';
import { Icon, Text } from 'react-native-paper';
import { View } from 'react-native';

import { formatDistance, getUpDown } from '../../../../lib/utils';
import { useAppSelector } from '../../../hooks';
import { selectUnitPrefs } from '../../general/selectors';
import { RoutingSegment } from '../types';


const SegmentInfo = ({ segment }: { segment: RoutingSegment }) => {
	const unitPrefs = useAppSelector(selectUnitPrefs);

	if (
		segment?.coordinatesSimplified &&
		segment.coordinatesSimplified.length > 0 &&
		undefined !==
			segment.coordinatesSimplified[segment.coordinatesSimplified.length - 1].distance
	) {
		const distanceString = formatDistance(
			segment.coordinatesSimplified[segment.coordinatesSimplified.length - 1].distance || 0,
			unitPrefs.distance
		);

		const { up, down } = getUpDown(segment?.coordinatesSimplified);

		return (
			<View
				style={{
					justifyContent: 'flex-start',
					alignItems: 'center',
					flexDirection: 'row',
					flexGrow: 1,
					// marginRight: 10,
				}}
			>
				<Text style={{ marginRight: 5 }}>{distanceString}</Text>
				<Icon
					source="arrow-up"
					size={15}
				/>
				<Text style={{ marginRight: 5 }}>
					{Math.round(up) + ' m'}
					{/* ??? should format with units */}
				</Text>
				<Icon
					source="arrow-down"
					size={15}
				/>
				<Text style={{ marginRight: 5 }}>
					{Math.round(down) + ' m'}
					{/* ??? should format with units */}
				</Text>
			</View>
		);
	} else {
		return null;
	}
};

export default SegmentInfo;