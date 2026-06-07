/**
 * External dependencies
 */
import React, { FC, useEffect, useMemo, useState } from 'react';

/**
 * react-native-mapsforge-vtm dependencies
 */
import {
	MapContainer,
	LayerPath,
} from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../hooks';
import {
	selectIsRouting,
} from '../../routing/selectors';
import { selectLines } from '../selectors';
import { getRoutesWithPoints } from '../../routing/db/selectors';


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

const LinesMapView = () => {
	const lines = useAppSelector(selectLines);

	const [routingLineId, setRoutingLineId] = useState<number | undefined>(undefined);

	const isRouting = useAppSelector(selectIsRouting);

	useEffect(() => {
		(async () => {
			if (isRouting) {
				const routes = await getRoutesWithPoints({ routeId: isRouting });
				if (routes.length) {
					setRoutingLineId(routes[0].line_id || undefined);
					return;
				}
			}
			setRoutingLineId(undefined);
		})();
	}, [isRouting]);

	return lines.map(
		(line) =>
			routingLineId !== line.id && (
				<Line
					key={line.id}
					line={line}
				/>
			)
	);
};

export default LinesMapView;
