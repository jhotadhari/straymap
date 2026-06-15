/**
 * External dependencies
 */
import React, { FC, useMemo } from 'react';
import { useQuery, WithRequired } from '@tanstack/react-query';
import { MapContainer, LayerPath } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../hooks';
import { selectSelected } from '../selectors';
import { queryLineGeom } from '../db/queryFns';
import useRoute from '../../routing/hooks/useRoute';

const LineItem: FC<{
	lineId: number;
}> = ({ lineId }) => {
	const { data: line } = useQuery({
		queryKey: ['lineGeom', lineId],
		queryFn: queryLineGeom,
	});

	const positions = useMemo(
		() =>
			line
				? line.geometry.coordinates.map((arr: number[]) => ({
						lng: arr[0],
						lat: arr[1],
						...(arr.length > 2 && { alt: arr[2] }),
					}))
				: undefined,
		[line?.geometry?.coordinates]
	);

	return (
		positions && <MapContainer.View>
			<LayerPath
				positions={positions}
				style={{
					strokeColor: '#ff0000',
					strokeWidth: 5,
				}}
			/>
		</MapContainer.View>
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

	return selectedIds?.map((lineId) => {
		return (
			routingLineId !== lineId &&
			visibleMap[lineId] && (
				<LineItem
					key={lineId}
					lineId={lineId}
				/>
			)
		);
	});
};

export default LinesMapView;
