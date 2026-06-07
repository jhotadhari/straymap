/**
 * External dependencies
 */
import React, { FC, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, LayerPath } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../hooks';
import { selectIsRouting } from '../../routing/selectors';
import { selectSelectedIds } from '../selectors';
import { queryRoutingLineId } from '../../routing/db/queries';
import { queryLines } from '../db/queries';
import { LineWithTags } from '../types';

const Line: FC<{
	line: LineWithTags;
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
				// responseInclude={{
				// 	coordinates: 1,
				// 	// 	// coordinatesSimplified: 1,
				// }}
				positions={positions}
				style={{
					strokeColor: '#ff0000',
					strokeWidth: 5,
				}}
				// onCreate={(response) => {
				// 	console.log('debug response', response); // debug
				// }}
			/>
		</MapContainer.View>
	);
};



const LinesMapView = () => {
	const isRouting = useAppSelector(selectIsRouting);
	const selectedIds = useAppSelector(selectSelectedIds);

	// const queryClient = useQueryClient();

	// console.log( 'debug queryClient', queryClient ); // debug

	const { data: lines } = useQuery({
		queryKey: ['lines', selectedIds],
		queryFn: () => queryLines(selectedIds),
	});

	const { data: routingLineId } = useQuery({
		queryKey: ['routingLineId', isRouting],
		queryFn: () => queryRoutingLineId(isRouting),
	});

	return lines?.map((line) => {
		return (
			routingLineId !== line.id && (
				<Line
					key={line.id}
					line={line}
				/>
			)
		);
	});
};

export default LinesMapView;
