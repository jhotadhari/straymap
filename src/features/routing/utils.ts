/**
 * External dependencies
 */
import { getRoute } from 'react-native-brouter/geojson';
import { distance, point } from '@turf/turf';

/**
 * Internal dependencies
 */
import { RoutingSegment, BrouterOptions, StraightLineOptions, RoutingProfile } from './types';
import { getAltitudeAtPosition } from './altitude';

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

const getBrouterCoords = (waypoints: number[][], opts: BrouterOptions): Promise<number[][]> =>
	new Promise<number[][]>((resolve, reject) => {
		getRoute({
			waypoints,
			vehicle: opts.v,
			fast: opts.fast,
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

const getStraightLineCoords = async (
	waypoints: number[][],
	opts: StraightLineOptions
): Promise<number[][]> => {
	const interval = opts.interval || 1000;
	const [from, to] = waypoints;
	const dist = distance(point(from), point(to), { units: 'meters' });
	const numSegments = Math.max(1, Math.ceil(dist / interval));

	const coords: Array<{ lng: number; lat: number }> = [];
	for (let i = 0; i <= numSegments; i++) {
		const f = i / numSegments;
		coords.push({
			lng: from[0] + (to[0] - from[0]) * f,
			lat: from[1] + (to[1] - from[1]) * f,
		});
	}

	const enriched = await Promise.all(
		coords.map(async ({ lng, lat }) => {
			const alt = await getAltitudeAtPosition(lng, lat);
			return [
				lng,
				lat,
				alt ?? 0,
			] as number[];
		})
	);
	return enriched;
};

export const getCoordsFromRouting = async ({
	waypoints,
	profile,
}: {
	waypoints: number[][];
	profile: RoutingProfile;
}): Promise<number[][]> => {
	switch (profile.provider) {
		case 'brouter':
			return getBrouterCoords(waypoints, profile.options);
		case 'straightLine':
			return getStraightLineCoords(waypoints, profile.options);
	}
};
