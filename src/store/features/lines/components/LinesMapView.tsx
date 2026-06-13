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
import { selectIsRouting } from '../../routing/selectors';
import { selectSelected } from '../selectors';
import { queryRoutingLineId } from '../../routing/db/queries';
import { LinePartial } from '../types';
import { FetchLinesParams } from '../db/fetch';
import { queryLines } from '../db/queries';

const LineItem: FC<{
	line: WithRequired<LinePartial, 'geometry'>;
}> = ({ line }) => {
	const positions = useMemo(
		() =>
			line.geometry.coordinates.map((arr: number[]) => ({
				lng: arr[0],
				lat: arr[1],
				...(arr.length > 2 && { alt: arr[2] }),
			})),
		[line.geometry.coordinates]
	);

	return (
		<MapContainer.View>
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
	const routeId = useAppSelector(selectIsRouting);
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

	const linesQueryParams : FetchLinesParams = useMemo( () => ( {
		lineIds: selectedIds,
		fieldsInclude: ['geometry'],
	} ), [selectedIds] );

	const { data: lines } = useQuery({
		queryKey: ['linesGeom', selectedIds],
		queryFn: () => queryLines( linesQueryParams ) as Promise<WithRequired<LinePartial, 'geometry'>[]>,
	});

	const { data: routingLineId } = useQuery({
		queryKey: ['routingLineId', routeId],
		queryFn: () => queryRoutingLineId(routeId),
	});

	return lines?.map((line) => {
		return (
			routingLineId !== line.id &&
			visibleMap[line.id] && (
				<LineItem
					key={line.id}
					line={line}
				/>
			)
		);
	});
};

export default LinesMapView;
