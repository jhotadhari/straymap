/**
 * External dependencies
 */
import React, { FC, useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GeometryStyle, LayerPath, ReindexScope, SharedLayer } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../hooks';
import { selectSelected } from '../selectors';
import { selectRoutingLineId } from '../../routing/selectors';
import { selectActiveLineId } from '../../trackRecording/selectors';
import { queryLineGeom } from '../db/queryFns';
import useSimplificationTolerance from '../hooks/useSimplificationTolerance';

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
		queryKey: [
			'lineGeom',
			lineId,
			...(simplify ? [simplify] : []),
		],
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

	const coordsLastRef = useRef<undefined | number[][]>(undefined);
	useEffect(() => {
		if (line?.geometry?.coordinates) {
			coordsLastRef.current = line?.geometry?.coordinates;
		}
	}, [line?.geometry?.coordinates]);

	if (!line?.geometry?.coordinates || !coordsLastRef?.current) return undefined;

	return (
		<LayerPath
			coordinates={line?.geometry?.coordinates ?? coordsLastRef?.current}
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
	const recordingLineId = useAppSelector(selectActiveLineId);

	console.log( 'debug routingLineId', routingLineId ); // debug

	const simplify = useSimplificationTolerance();

	return (
		<ReindexScope order={200}>
			<SharedLayer>
				{simplify === undefined
					? undefined
					: selectedIds?.map((lineId) => {
							return (
								routingLineId !== lineId &&
								recordingLineId !== lineId &&
								visibleMap[lineId] && (
									<LineItem
										key={lineId}
										lineId={lineId}
										simplify={simplify}
										strokeColor={'#ff2222'}
									/>
								)
							);
						})}
			</SharedLayer>
		</ReindexScope>
	);
};

export default LinesMapView;
