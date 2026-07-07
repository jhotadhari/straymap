/**
 * External dependencies
 */
import { getRoute } from 'react-native-brouter/geojson';
import type { VehicleMode } from 'react-native-brouter/geojson';

/**
 * Internal dependencies
 */
import { RoutingSegment } from './types';

export const getSegmentRecordId = (segment: Pick<RoutingSegment, 'fromId' | 'toId'>) =>
	[
		segment.fromId,
		segment.toId,
	].join('_');

export const aggregateSegmentsToCoords = (segments: RoutingSegment[]) =>
	segments.reduce((acc, seg) => {
		if (seg?.positions) {
			acc.push(...seg.positions);
		}
		return acc;
	}, [] as number[][]);

export const getCoordsFromRouting = ({
	waypoints,
	vehicle,
	fast,
}: {
	waypoints: number[][];
	vehicle?: VehicleMode;
	fast?: boolean;
}) => {
	return new Promise<number[][]>((resolve, reject) => {
		getRoute({
			waypoints,
			vehicle,
			fast,
			format: 'json',
		})
			.then((result) => {
				const coords =
					result.parsed?.track.features.flatMap((f) => f.geometry.coordinates) ?? [];
				resolve(coords);
			})
			.catch((e: any) => {
				reject(e?.message ?? 'Some error');
			});
	});
};
