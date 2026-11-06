/**
 * External dependencies
 */
import React, { FC, useEffect, useMemo, useState } from 'react';
import { Text } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import { DashboardWidgetProps } from '../../../dashboard/types';
import useItemStyle from '../../../dashboard/hooks/useItemStyle';
import ElementFrame from '../../../dashboard/components/ElementFrame';
import { useAppSelector } from '../../../../store/hooks';
import { selectIsRecording, selectTrackLineId, selectRecordingStartTime } from '../../selectors';
import { queryLineGeom } from '../../../lines/db/queryFns';
import {
	formatDistance,
	formatDurationCompact,
	formatHeightDepth,
	formatSpeed,
	haversineLineLength,
} from '../../../../lib/formatting';
import { selectUnitPrefs } from '../../../general/selectors';
import STATS from './STATS';

const Display: FC<DashboardWidgetProps> = ({ item, style = {}, onPress }) => {
	const { fontSize, minWidth, textAlign, showLabel, showIcon } = useItemStyle(item);
	const unitPrefs = useAppSelector(selectUnitPrefs);

	const isRecording = useAppSelector(selectIsRecording);
	const trackLineId = useAppSelector(selectTrackLineId);
	const recordingStartTime = useAppSelector(selectRecordingStartTime);

	const statKey = STATS.find((stat) => stat.key === item.elementType)?.key;

	// Live elapsed timer based on recording start.
	const [elapsed, setElapsed] = useState(0);
	useEffect(() => {
		if (!isRecording || !recordingStartTime) {
			setElapsed(0);
			return;
		}
		setElapsed(Math.floor((Date.now() - recordingStartTime) / 1000));
		const timer = setInterval(() => {
			setElapsed(Math.floor((Date.now() - recordingStartTime) / 1000));
		}, 1000);
		return () => clearInterval(timer);
	}, [isRecording, recordingStartTime]);

	const { data: line } = useQuery({
		queryKey: [
			'lineGeom',
			trackLineId ?? -1,
		],
		queryFn: queryLineGeom,
		enabled: !!trackLineId,
		staleTime: Infinity,
		gcTime: 1000 * 10,
	});

	const statValue = useMemo(() => {
		const coords = line?.geometry?.coordinates;

		// Stop is pause: while tracking is off the parked line is still
		// on the map, and the distance widget keeps showing its total
		// (frozen). All other stats need a live recording.
		if (!isRecording) {
			if (statKey !== 'trackingDistance' || !coords) {
				return null;
			}
			return formatDistance(haversineLineLength(coords), get(unitPrefs, ['distance']));
		}

		switch (statKey) {
			case 'trackingDistance': {
				if (!coords) {
					return null;
				}
				const total = haversineLineLength(coords);
				return formatDistance(total, get(unitPrefs, ['distance']));
			}
			case 'trackingPointCount':
				return coords ? `${coords.length}` : null;
			case 'trackingUphill':
			case 'trackingDownhill': {
				if (!coords) {
					return null;
				}
				let delta = 0;
				for (let i = 1; i < coords.length; i++) {
					const dz = (coords[i][2] ?? 0) - (coords[i - 1][2] ?? 0);
					if ('trackingUphill' === statKey && dz > 0) {
						delta += dz;
					}
					if ('trackingDownhill' === statKey && dz < 0) {
						delta += -dz;
					}
				}
				return formatHeightDepth(delta, get(unitPrefs, ['heightDepth']));
			}
			case 'trackingDuration':
				return recordingStartTime ? formatDurationCompact(elapsed) : null;
			case 'trackingAvgSpeed': {
				if (!coords || !recordingStartTime || !elapsed) {
					return null;
				}
				return formatSpeed(
					haversineLineLength(coords) / elapsed,
					get(unitPrefs, ['speed'])
				);
			}
			default:
				return null;
		}
	}, [
		isRecording,
		statKey,
		line,
		unitPrefs,
		recordingStartTime,
		elapsed,
	]);

	const textStyle = useMemo(() => ({ fontSize, textAlign }), [fontSize, textAlign]);

	return (
		<ElementFrame
			item={item}
			style={style}
			minWidth={minWidth}
			fontSize={fontSize}
			showLabel={showLabel}
			showIcon={showIcon}
			textAlign={textAlign}
			onPress={onPress}
		>
			<Text style={textStyle}>{statValue ?? '-'}</Text>
		</ElementFrame>
	);
};

export default Display;
