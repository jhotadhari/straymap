/**
 * External dependencies
 */
import React, { FC, useMemo } from 'react';
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
import { selectIsRecording, selectActiveLineId } from '../../selectors';
import { queryLineGeom } from '../../../lines/db/queryFns';
import { formatDistance, haversineLineLength } from '../../../../lib/formatting';
import { selectUnitPrefs } from '../../../general/selectors';

export interface Options {
	statField: string;
}

const Display: FC<DashboardWidgetProps<Options>> = ({ item, style = {}, onPress }) => {
	const { fontSize, minWidth, textAlign, showLabel, showIcon } = useItemStyle(item);
	const unitPrefs = useAppSelector(selectUnitPrefs);

	const isRecording = useAppSelector(selectIsRecording);
	const activeLineId = useAppSelector(selectActiveLineId);

	const statField = item?.options?.statField ?? 'distance';

	const lineId = (isRecording ? activeLineId : null) ?? -1;
	const { data: line } = useQuery({
		queryKey: [
			'lineGeom',
			lineId,
			'trackingStats',
		],
		queryFn: queryLineGeom,
		enabled: !!isRecording && !!activeLineId,
		staleTime: Infinity,
		gcTime: 1000 * 10,
	});

	const statValue = useMemo(() => {
		if (!line?.geometry?.coordinates) {
			return null;
		}
		const coords = line.geometry.coordinates;

		switch (statField) {
			case 'distance': {
				const total = haversineLineLength(coords);
				const distUnit = get(unitPrefs, ['distance']);
				return formatDistance(total, distUnit);
			}
			case 'pointCount':
				return `${coords.length}`;
			default:
				return '-';
		}
	}, [
		line,
		statField,
		unitPrefs,
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
