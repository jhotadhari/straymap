/**
 * External dependencies
 */
import React, { FC, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GeometryStyle, LayerPath, ReindexScope } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../hooks';
import { selectSelected } from '../selectors';
import { selectRoutingLineId } from '../../routing/selectors';
import { queryLineGeom } from '../db/queryFns';
import { queryLinesWithoutGeom } from '../db/queryFns';
import useSimplificationTolerance from '../hooks/useSimplificationTolerance';
import { getTagColor } from './tagColor';
import { Line } from '../types';

const BASE_STROKE_WIDTH = 5;

// GeometryStyle is a custom map-layer style type, not an RN ViewStyle, so it stays a plain object.
const defaultPathStyle: GeometryStyle = {
	strokeColor: '#ff0000',
	strokeWidth: BASE_STROKE_WIDTH,
};

const LineItem: FC<{
	lineId: number;
	simplify?: number;
}> = ({ lineId, simplify }) => {
	// Fetch geometry
	const { data: line } = useQuery({
		queryKey: ['lineGeom', lineId, ...(simplify ? [simplify] : [])],
		queryFn: queryLineGeom,
		gcTime: 1000 * 10,
	});

	// Fetch line metadata (tags) for color
	const { data: lines } = useQuery({
		queryKey: ['lines', [lineId]],
		queryFn: queryLinesWithoutGeom,
		gcTime: 1000 * 10,
	});

	const pathStyle = useMemo((): GeometryStyle => {
		const lineData = lines?.find((l: Omit<Line, 'geometry'>) => l.id === lineId);
		const firstTag = lineData?.tags?.[0];
		if (firstTag) {
			const color = getTagColor(firstTag);
			return {
				strokeColor: color.bg as `#${string}`,
				strokeWidth: BASE_STROKE_WIDTH,
			};
		}
		return defaultPathStyle;
	}, [lines, lineId]);

	if (!line?.geometry?.coordinates) return null;

	return (
		<LayerPath
			coordinates={line.geometry.coordinates}
			style={pathStyle}
		/>
	);
};

const LinesMapView = () => {
	const selected = useAppSelector(selectSelected);

	const { selectedIds, visibleMap } = useMemo(
		() => ({
			selectedIds: selected.map((a) => a.id),
			visibleMap: selected.reduce<{ [id: string]: boolean }>((acc, a) => {
				acc[a.id] = a.visible;
				return acc;
			}, {}),
		}),
		[selected]
	);

	const routingLineId = useAppSelector(selectRoutingLineId);

	const simplify = useSimplificationTolerance();

	return (
		<ReindexScope>
			{selectedIds?.map((lineId) => {
				return (
					routingLineId !== lineId &&
					visibleMap[lineId] && (
						<LineItem
							key={lineId}
							lineId={lineId}
							simplify={simplify}
						/>
					)
				);
			})}
		</ReindexScope>
	);
};

export default LinesMapView;
