/**
 * External dependencies
 */
import React, { FC, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, LayerPath } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../hooks';
import { selectSelected } from '../selectors';
import { queryLineGeom } from '../db/queryFns';
import useRoute from '../../routing/hooks/useRoute';
import useSimplificationTolerance from '../hooks/useSimplificationTolerance';

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

	const [positions, setPositions] = useState<
		| {
				alt?: number | undefined;
				lng: number;
				lat: number;
		  }[]
		| undefined
	>(undefined);

	useEffect(() => {
		if (line?.geometry?.coordinates) {
			setPositions(
				line.geometry.coordinates.map((arr: number[]) => ({
					lng: arr[0],
					lat: arr[1],
					...(arr.length > 2 && { alt: arr[2] }),
				}))
			);
		}
	}, [line?.geometry?.coordinates]);

	return (
		positions && (
			<MapContainer.View>
				<LayerPath
					positions={positions}
					style={{
						strokeColor: '#ff0000',
						strokeWidth: 5,
					}}
				/>
			</MapContainer.View>
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

	const { line_id: routingLineId } = useRoute(['line_id']) || {};

	const simplify = useSimplificationTolerance();

	return (
		selectedIds?.map((lineId) => {
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
		})
	);
};

export default LinesMapView;
