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

const BASE_STROKE_WIDTH = 5;

// GeometryStyle is a custom map-layer style type, not an RN ViewStyle, so it stays a plain object.
const defaultPathStyle: GeometryStyle = {
	strokeColor: '#ff0000',
	strokeWidth: BASE_STROKE_WIDTH,
};

const LineItem: FC<{
	lineId: number;
	simplify?: number;
	strokeColor?: string;
}> = ({ lineId, simplify, strokeColor }) => {
	// Fetch geometry only — tag colour comes from the parent batch query
	const { data: line } = useQuery({
		queryKey: ['lineGeom', lineId, ...(simplify ? [simplify] : [])],
		queryFn: queryLineGeom,
		gcTime: 1000 * 10,
	});

	const pathStyle = useMemo((): GeometryStyle => {
		if (strokeColor) {
			// getTagColor always returns valid #RRGGBB hex (palette or normalised custom),
			// so the value is safe for GeometryStyle's `#${string}` constraint.
			return {
				strokeColor: strokeColor as `#${string}`,
				strokeWidth: BASE_STROKE_WIDTH,
			};
		}
		return defaultPathStyle;
	}, [strokeColor]);

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

	// Batch-fetch metadata for all selected lines once, rather than one
	// query per line. Each LineItem still fetches its own geometry (large,
	// per-line cache key), but the lightweight tag lookup is shared.
	const { data: lines } = useQuery({
		queryKey: ['lines', selectedIds],
		queryFn: queryLinesWithoutGeom,
		gcTime: 1000 * 10,
		enabled: selectedIds.length > 0,
	});

	// lineId → stroke colour map from the first tag on each line
	const tagColorMap = useMemo(() => {
		const map: Record<number, string> = {};
		if (!lines) return map;
		for (const l of lines) {
			const firstTag = l.tags?.[0];
			if (firstTag) {
				map[l.id] = getTagColor(firstTag).bg;
			}
		}
		return map;
	}, [lines]);

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
							strokeColor={tagColorMap[lineId]}
						/>
					)
				);
			})}
		</ReindexScope>
	);
};

export default LinesMapView;
