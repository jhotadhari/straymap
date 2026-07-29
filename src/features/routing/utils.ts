/**
 * External dependencies
 */
import { getRoute } from 'react-native-brouter/geojson';
import { enrichCoordinatesWithElevation } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import {
	RoutingSegment,
	BrouterOptions,
	StraightLineOptions,
	RoutingProfile,
	BrouterCompressionMode,
	RoutingPoint,
} from './types';
import { altitudeService } from '../../lib/AltitudeService';
import { haversineDistance } from '../../lib/formatting';
import { DEFAULT_INHERIT_MODE } from './constants';
import { isEqual } from 'lodash-es';

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

/**
 * Fetch coordinates from BRouter, with optional compression fallback.
 *
 * Three modes, controlled by {@link BrouterOptions.compressionMode}:
 *
 * - **`off`** (default): JSON format, no compression, elevation from BRouter.
 *   Current behaviour — unchanged.
 * - **`on`**: GPX+compression through AIDL (avoids Binder buffer overflow on
 *   long routes), then elevation enriched from the app's own DEM data via
 *   {@link enrichCoordinatesWithElevation}.
 * - **`auto`**: Try `off` first.  On any routing error, silently retry with
 *   `on`.  Gives BRouter-native elevation for short/medium routes with
 *   transparent fallback to compressed+app‑DEM for long routes.
 */
const getBrouterCoords = async (
	waypoints: number[][],
	opts: BrouterOptions
): Promise<number[][]> => {
	const mode: BrouterCompressionMode = opts.compressionMode ?? 'off';

	/**
	 * Fetch via the uncompressed JSON path (mode `off`).
	 */
	const fetchUncompressed = (): Promise<number[][]> =>
		new Promise<number[][]>((resolve, reject) => {
			getRoute({
				waypoints,
				vehicle: opts.v,
				fast: opts.fast,
				format: 'json',
			})
				.then((result) => {
					if (!result.parsed) {
						reject(new Error('Failed to parse BRouter JSON track'));
						return;
					}
					const coords =
						result.parsed?.track.features.flatMap((f) => f.geometry.coordinates) ?? [];
					resolve(coords);
				})
				.catch((e: any) => {
					reject(new Error(e?.message ?? 'Some error'));
				});
		});

	/**
	 * Fetch via the compressed GPX→JSON path (mode `on`).
	 *
	 * The native module forces GPX+compression through AIDL, decompresses,
	 * converts GPX to JSON, and returns it.  Elevation is not present in
	 * the converted output — we enrich it from the app's own DEM data.
	 */
	const fetchCompressed = async (): Promise<number[][]> => {
		const result = await getRoute({
			waypoints,
			vehicle: opts.v,
			fast: opts.fast,
			format: 'json',
			compressGpxToJson: true,
		});

		if (!result.parsed) {
			throw new Error('Failed to parse BRouter JSON track (compressed)');
		}

		const coords: number[][] =
			result.parsed?.track.features.flatMap((f) =>
				f.geometry.coordinates.map((c) => [
					c[0] as number,
					c[1] as number,
					0,
				])
			) ?? [];

		// Enrich with elevation from the app's DEM data.
		await enrichCoordinatesWithElevation(coords, altitudeService.requireHandle());

		return coords;
	};

	switch (mode) {
		case 'on':
			return fetchCompressed();

		case 'auto':
			try {
				return await fetchUncompressed();
			} catch {
				return fetchCompressed();
			}

		case 'off':
		default:
			return fetchUncompressed();
	}
};

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
	await enrichCoordinatesWithElevation(coords, altitudeService.requireHandle());

	return coords;
};

/*
 * Resolve which RoutingProfile a point uses for its outgoing segment.
 * Pure function — does not access Redux state. Callers must provide
 * a valid routeProfile and handle the lastProfiles → DEFAULT_PROFILE
 * fallback chain themselves.
 *
 * @param point       The routing point to resolve
 * @param index       The point's index in the points array
 * @param points      All points of the route (ordered)
 * @param routeProfile The route-level profile (always present)
 * @returns The effective RoutingProfile for this point's segment
 *
 * - 'own'  → returns point.profile
 * - 'route' → returns routeProfile
 * - 'prev'  → resolves the previous point recursively;
 *              first point falls back to routeProfile
 */
export const resolveProfileForPoint = (
	point: RoutingPoint,
	index: number,
	points: RoutingPoint[],
	routeProfile: RoutingProfile
): RoutingProfile => {
	const mode = point.inheritMode ?? DEFAULT_INHERIT_MODE;

	if (mode === 'own') {
		return point.profile!;
	}

	if (mode === 'route') {
		return routeProfile;
	}

	if (index === 0) {
		return routeProfile;
	}

	return resolveProfileForPoint(points[index - 1], index - 1, points, routeProfile);
};

/*
 * Walk points from startIdx forward, comparing resolveProfileForPoint
 * for old vs new state. Collects segment IDs where the resolved profile
 * actually changed (deep-equal via lodash isEqual). Stops on the first
 * unchanged profile — subsequent 'prev' points inherit from that
 * unchanged ancestor, so their segments also haven't changed.
 *
 * Used to avoid expensive BRouter recomputation when a profile edit
 * doesn't actually change the effective routing profile for some segments.
 *
 * @param points        The route's points (ordered). IDs are read from here.
 * @param routeProfile  The old route-level profile
 * @param options.startIdx       Start index (default 0)
 * @param options.newPoints      Points with modifications applied (default: points)
 * @param options.newRouteProfile New route-level profile (default: routeProfile)
 * @returns Array of segment record IDs that need re-processing
 */
export const getChangedSegmentIds = (
	points: RoutingPoint[],
	routeProfile: RoutingProfile,
	options: {
		startIdx?: number;
		newPoints?: RoutingPoint[];
		newRouteProfile?: RoutingProfile;
	}
): string[] => {
	const { startIdx = 0, newPoints = points, newRouteProfile = routeProfile } = options;

	const segmentIds: string[] = [];
	for (let i = startIdx; i < points.length - 1; i++) {
		const oldProfile = resolveProfileForPoint(points[i], i, points, routeProfile);
		const newProfile = resolveProfileForPoint(newPoints[i], i, newPoints, newRouteProfile);
		if (!isEqual(oldProfile, newProfile)) {
			segmentIds.push(
				getSegmentRecordId({
					fromId: points[i].id,
					toId: points[i + 1].id,
				})
			);
		} else {
			break;
		}
	}
	return segmentIds;
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
