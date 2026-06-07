/**
 * External dependencies
 */
import React, { FC, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { omit } from 'lodash-es';
import { LineString } from 'geojson';

/**
 * react-native-mapsforge-vtm dependencies
 */
import { MapContainer, LayerPath } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../hooks';
import { selectIsRouting } from '../../routing/selectors';
import { selectSelectedIds } from '../selectors';
import { getRoutesWithPoints } from '../../routing/db/selectors';
import { getLinesWithTags } from '../db/selectors';
import { parseSerialized } from '../../../../lib/utilsGeneral';

const Line: FC<{
	line: any;
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

const getLines = async (lineIds: number[]) => {
	const lines = await getLinesWithTags({
		lineIds,
		allLines: true,
	});
	const newLinesFromDb = lines.map((line) => {
		return {
			...omit(line, 'geometryGeoJSON'),
			geometry: parseSerialized<LineString>(line.geometryGeoJSON)!,
		};
	});
	return newLinesFromDb;
};

const getRoutingLineId = async (routeId?: number | false) => {
	if (routeId) {
		const routes = await getRoutesWithPoints({ routeId });
		if (routes.length) {
			return routes[0].line_id || null;
		}
	}
	return null;
};

const LinesMapView = () => {
	const isRouting = useAppSelector(selectIsRouting);
	const selectedIds = useAppSelector(selectSelectedIds);

	// const queryClient = useQueryClient();

	const queryLines = useQuery({
		queryKey: ['lines', selectedIds],
		queryFn: () => getLines(selectedIds),
	});

	const queryRoutingLineId = useQuery({
		queryKey: ['routingLineId', isRouting],
		queryFn: () => getRoutingLineId(isRouting),
	});

	return (
		queryLines.data?.map((line) => {
			return (
				queryRoutingLineId.data !== line.id && (
					<Line
						key={line.id}
						line={line}
					/>
				)
			);
		})
	);
};

export default LinesMapView;
