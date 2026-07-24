/**
 * External dependencies
 */
import { getRoute } from 'react-native-brouter/geojson';

/**
 * Internal dependencies
 */
import { enrichCoordinatesWithElevation } from 'react-native-mapsforge-vtm';
import type { ElevationAPI } from 'react-native-mapsforge-vtm';
import { RoutingSegment, BrouterOptions, StraightLineOptions, RoutingProfile } from './types';
import { altitudeService } from '../../lib/AltitudeService';
import { haversineDistance } from '../../lib/formatting';

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
				if (!result.parsed) {
					reject('Failed to parse BRouter JSON track');
					return;
				}
				const coords =
					result.parsed?.track.features.flatMap((f) => f.geometry.coordinates) ?? [];
				resolve(coords);
			})
			.catch((e: any) => {
				reject(e?.message ?? 'Some error');
			});
	});

const MAX_STRAIGHT_LINE_SEGMENTS = 5000;

const getStraightLineCoords = async (
	waypoints: number[][],
	opts: StraightLineOptions
): Promise<number[][]> => {
	const interval = opts.interval ?? 1000;
	const [from, to] = waypoints;
	const dist = haversineDistance(
		[from[0], from[1]] as [number, number],
		[to[0], to[1]] as [number, number]
	);
	const numSegments = Math.min(
		MAX_STRAIGHT_LINE_SEGMENTS,
		Math.max(1, Math.ceil(dist / interval))
	);

	// Always produce 3D coords — the DB stores LINESTRINGZ and requires
	// three numbers per coordinate.  Altitude defaults to 0 (sea level)
	// and is enriched below when DEM data is available.
	const coords: number[][] = [];
	coords.push([
		from[0],
		from[1],
		from[2] ?? 0,
	]);

	for (let i = 1; i < numSegments; i++) {
		const f = i / numSegments;
		coords.push([
			from[0] + (to[0] - from[0]) * f,
			from[1] + (to[1] - from[1]) * f,
			0,
		]);
	}
	coords.push([
		to[0],
		to[1],
		to[2] ?? 0,
	]);

	// Enrich with altitude — delegates to the library’s windowed
	// three-phase flow.  Coordinates are grouped by 1°×1° SRTM tile;
	// tiles without HGT files are automatically skipped.  The LRU
	// cache capacity is temporarily raised to the window size so the
	// collect phase is always a guaranteed cache hit.
	const elevationAPI: ElevationAPI = {
		getAltitudeAtPosition: async (lng, lat) => {
			const fn = altitudeService.getRawAltitudeFn();
			if (!fn) throw new Error('Altitude lookup not wired');
			return fn(lng, lat);
		},
		hasDataAtPosition: async (lng, lat) => {
			const fn = altitudeService.getRawHasDataFn();
			if (!fn) return false;
			return fn(lng, lat);
		},
		setCacheCapacity: async (capacity) => {
			const fn = altitudeService.getSetCacheCapacityFn();
			if (!fn) throw new Error('setCacheCapacity not wired');
			await fn(capacity);
		},
		isTileCached: async (lng, lat) => {
			const fn = altitudeService.getIsTileCachedFn();
			if (!fn) return false;
			return fn(lng, lat);
		},
	};

	await enrichCoordinatesWithElevation(coords, elevationAPI);

	return coords;
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
		default:
			throw new Error(`Unknown routing provider: ${(profile as any)?.provider}`);
	}
};
