/**
 * External dependencies
 */
import { getTrackFromParams, GetTrackParams } from 'react-native-brouter';
import { FeatureCollection, LineString } from 'geojson';

/**
 * Internal dependencies
 */
import { parseSerialized } from '../../../lib/utilsLight';
import { RoutingSegment } from './types';
import { locationsToCoordsArr, runAfterInteractions } from '../../../lib/utils';
import { fetchRoutes } from './db/fetch';
import { store } from '../../store';
import { setPoints } from './routingSlice';

export const getSegmentRecordId = (segment: RoutingSegment) =>
	[
		segment.fromId,
		segment.toId,
	].join('_');

export const aggregateSegmentsToCoords = (segments: RoutingSegment[]) =>
	segments.reduce((acc, seg) => {
		if (seg?.positions) {
			acc.push(...locationsToCoordsArr(seg?.positions));
		}
		return acc;
	}, [] as number[][]);

export const getCoordsFromRouting = ({
	params,
	hasDelay,
}: {
	params: GetTrackParams;
	hasDelay: boolean; // ??? do we really need that delay???
}) => {
	return new Promise<number[][]>((resolve, reject) => {
		runAfterInteractions(
			() => {
				setTimeout(
					() =>
						getTrackFromParams(params)
							.then((result: string) => {
								const parsed = parseSerialized(result) as
									| false
									| FeatureCollection<LineString,any>;
								if (parsed) {
									const coords = [...parsed.features]
										.map((feature) => feature.geometry.coordinates)
										.flat();
									resolve(coords);
								} else {
									reject(result);
								}
							})
							.catch((e: any) => {
								reject(e?.userInfo?.errorMsg ?? 'Some error');
							}),
					hasDelay ? 0 : 400
				);
			},
			hasDelay ? 0 : 100
		);
	});
};

// ??? should be done by mutations somehow
export const updateStorePointsFromDb = async (routeId: number) => {
	const routes = await fetchRoutes({
		routeId,
	});

	if (!routes?.length) {
		return;
	}

	store.dispatch(setPoints(routes[0].points));
};
