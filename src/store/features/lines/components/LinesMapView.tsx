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
import useSimplificationTolerance from '../hooks/useSimplificationTolerance';

// GeometryStyle is a custom map-layer style type, not an RN ViewStyle, so it stays a plain object.
const pathStyle: GeometryStyle = {
	strokeColor: '#ff0000',
	strokeWidth: 5,
};

const LineItem: FC<{
	lineId: number;
	simplify?: number;
}> = ({ lineId, simplify }) => {
	const { data: line } = useQuery({
		queryKey: [
			'lineGeom',
			lineId,
			...(simplify ? [simplify] : []),
		],
		queryFn: queryLineGeom,
		gcTime: 1000 * 10, // The time in milliseconds that unused/inactive cache data remains in memory. When a query's cache becomes unused or inactive, that cache data will be garbage collected after this duration.
	});

	return (
		line?.geometry?.coordinates && (
			<LayerPath
				coordinates={line.geometry.coordinates}
				style={pathStyle}
			/>
		)
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

	// Read routingLineId from Redux — always synchronous, no query
	// staleness window.  The routing thunk dispatches setRoutingLineId
	// at the same time as setLineSelected, so LinesMapView always
	// knows which line is the active routing line.
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
