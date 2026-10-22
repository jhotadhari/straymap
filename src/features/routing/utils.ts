/**
 * External dependencies
 */
import { getRoute } from 'react-native-brouter/geojson';
import { enrichCoordinatesWithElevation } from 'react-native-mapsforge-vtm';
import { lineString, simplify as turfSimplify } from '@turf/turf';
import { Position } from 'geojson';
import { readFile } from 'react-native-fs';

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
	RoutingSegmentHit,
} from './types';
import { altitudeService } from '../../lib/AltitudeService';
import { haversineDistance } from '../../lib/formatting';
import { logError } from '../../lib/utils';
import { DEFAULT_INHERIT_MODE } from './constants';
import { isEqual } from 'lodash-es';

export const getSegmentRecordId = (segment: Pick<RoutingSegment, 'fromId' | 'toId'>) =>
	[
		segment.fromId,
		segment.toId,
	].join('_');

/**
 * Segment record ids of the two segments touching a waypoint (the
 * incoming segment from the previous point and the outgoing segment to
 * the next point). Used to delete a moved point's cached
 * segments so processRouting refetches them instead of reusing stale
 * geometry.
 */
export const getAdjacentSegmentRecordIds = (points: RoutingPoint[], pointId: number): string[] => {
	const index = points.findIndex((p) => p.id === pointId);
	if (index === -1) {
		return [];
	}
	const ids: string[] = [];
	if (index > 0) {
		ids.push(
			getSegmentRecordId({
				fromId: points[index - 1].id,
				toId: pointId,
			})
		);
	}
	if (index < points.length - 1) {
		ids.push(
			getSegmentRecordId({
				fromId: pointId,
				toId: points[index + 1].id,
			})
		);
	}
	return ids;
};

export const aggregateSegmentsToCoords = (segments: RoutingSegment[]) =>
	segments.reduce((acc, seg) => {
		if (seg?.positions) {
			acc.push(...seg.positions);
		}
		return acc;
	}, [] as number[][]);

/**
 * Simplify one segment's positions with turf, mirroring exactly what
 * RoutingMapView renders. Straight-line segments are returned unsimplified
 * so the full per-coordinate elevation is preserved.
 */
export const getSimplifiedSegmentCoords = (
	positions: Position[] | undefined,
	simplify: number | undefined,
	provider?: string
): number[][] | undefined => {
	if (!positions || positions.length < 2 || simplify === undefined) {
		return undefined;
	}
	// Straight-line segments are already at the user-requested interval —
	// skip simplification so the full per-coordinate elevation is preserved.
	if (provider === 'straightLine') {
		return positions as number[][];
	}
	const line = lineString(positions);
	const result = turfSimplify(line, { tolerance: simplify, highQuality: false });
	return result.geometry.coordinates;
};

/**
 * Concatenated simplified coordinates for the whole route, in point order.
 * Segments that are still fetching, errored or too short are skipped —
 * matching the ramp segments actually rendered on the map. The provider
 * is resolved per point (inheritance included) so straight-line segments
 * keep their interval points — a raw `point.profile?.provider` would be
 * undefined for inherited profiles and the collinear intervals would be
 * simplified away to the two endpoints.
 */
export const getPathCoords = (
	points: RoutingPoint[],
	segments: Record<string, RoutingSegment>,
	simplify: number,
	routeProfile: RoutingProfile
): number[][] => {
	const coords: number[][] = [];
	points.forEach((fromPoint, index) => {
		const toPoint = points[index + 1];
		if (!toPoint) {
			return;
		}
		const segment = segments[getSegmentRecordId({ fromId: fromPoint.id, toId: toPoint.id })];
		if (
			!segment ||
			segment.isFetching ||
			segment.errorMsg ||
			(segment.positions?.length ?? 0) < 2
		) {
			return;
		}
		const provider = resolveProfileForPoint(fromPoint, index, points, routeProfile).provider;
		const simplified = getSimplifiedSegmentCoords(segment.positions, simplify, provider);
		if (simplified) {
			coords.push(...simplified);
		}
	});
	return coords;
};

// ---------------------------------------------------------------------------
// Center hit-testing for the gesture-workaround actions
// ---------------------------------------------------------------------------

const MERCATOR_MAX_LAT = 85.0511287798066;

const clampMercatorLat = (lat: number) => {
	if (lat > MERCATOR_MAX_LAT) return MERCATOR_MAX_LAT;
	if (lat < -MERCATOR_MAX_LAT) return -MERCATOR_MAX_LAT;
	return lat;
};

const latLngToMercator = (lat: number, lng: number): [number, number] => {
	const mx = (lng + 180) / 360;
	const latRad = (clampMercatorLat(lat) * Math.PI) / 180;
	const mercY = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
	return [mx, 0.5 - mercY / (2 * Math.PI)];
};

const wrapMxDelta = (dMx: number) => {
	if (dMx > 0.5) return dMx - 1;
	if (dMx < -0.5) return dMx + 1;
	return dMx;
};

/**
 * Projects a geo coordinate to a screen-dp offset relative to the map
 * center, using plain Web Mercator math identical to the library's
 * reanimated mercatorUtils. Straymap disables map rotation and tilt, so
 * bearing/tilt do not need to be accounted for.
 */
export const projectLngLatToCenterDpOffset = (
	center: [number, number],
	lngLat: [number, number],
	zoom: number,
	tileSize: number,
	density: number
): [number, number] => {
	const [centerMx, centerMy] = latLngToMercator(center[1], center[0]);
	const [pointMx, pointMy] = latLngToMercator(lngLat[1], lngLat[0]);
	const worldPx = tileSize * Math.pow(2, zoom);
	const scaleDp = density > 0 ? worldPx / density : worldPx;
	return [
		wrapMxDelta(pointMx - centerMx) * scaleDp,
		(pointMy - centerMy) * scaleDp,
	];
};

/**
 * Nearest position on a polyline (screen-dp offsets relative to the map
 * center) to the origin, with the fraction along the found edge so the
 * corresponding geo coordinate can be interpolated.
 */
const getNearestOnPolylineDp = (offsets: [number, number][]) => {
	let bestDistance = Infinity;
	let bestVertexIndex = 0;
	let bestFraction = 0;
	for (let i = 0; i < offsets.length - 1; i++) {
		const [ax, ay] = offsets[i];
		const [bx, by] = offsets[i + 1];
		const abx = bx - ax;
		const aby = by - ay;
		const abLen2 = abx * abx + aby * aby;
		let fraction = abLen2 > 0 ? -(ax * abx + ay * aby) / abLen2 : 0;
		fraction = Math.max(0, Math.min(1, fraction));
		const px = ax + abx * fraction;
		const py = ay + aby * fraction;
		const distance = Math.hypot(px, py);
		if (distance < bestDistance) {
			bestDistance = distance;
			bestVertexIndex = i;
			bestFraction = fraction;
		}
	}
	return {
		distance: bestDistance,
		vertexIndex: bestVertexIndex,
		fraction: bestFraction,
	};
};

/**
 * Hit-tests the map center against the rendered (simplified) route
 * segments. Returns the closest segment within `thresholdDp` screen
 * distance, the point-order index a cut waypoint should be inserted at,
 * and the snapped [lng, lat] coordinate on the segment.
 */
export const getNearestSegmentHit = ({
	points,
	simplifiedByRecordId,
	center,
	zoom,
	tileSize,
	density,
	thresholdDp,
}: {
	points: RoutingPoint[];
	simplifiedByRecordId: Record<string, number[][]>;
	center: [number, number];
	zoom: number;
	tileSize: number;
	density: number;
	thresholdDp: number;
}): RoutingSegmentHit | null => {
	let best: RoutingSegmentHit | null = null;
	let bestDistance = thresholdDp;

	points.forEach((fromPoint, index) => {
		const toPoint = points[index + 1];
		if (!toPoint) {
			return;
		}
		const segmentRecordId = getSegmentRecordId({
			fromId: fromPoint.id,
			toId: toPoint.id,
		});
		const coords = simplifiedByRecordId[segmentRecordId];
		if (!coords || coords.length < 2) {
			return;
		}
		const offsets = coords.map(
			(c) =>
				projectLngLatToCenterDpOffset(center, [c[0], c[1]], zoom, tileSize, density) as [
					number,
					number,
				]
		);
		const { distance, vertexIndex, fraction } = getNearestOnPolylineDp(offsets);
		if (distance < bestDistance) {
			bestDistance = distance;
			const from = coords[vertexIndex];
			const to = coords[vertexIndex + 1];
			best = {
				segmentRecordId,
				insertIndex: index + 1,
				nearest: [
					from[0] + (to[0] - from[0]) * fraction,
					from[1] + (to[1] - from[1]) * fraction,
				],
			};
		}
	});

	return best;
};

/**
 * Hit-tests the map center against the route's waypoints. Returns the
 * closest waypoint within `thresholdDp` screen distance.
 */
export const getNearestPointHit = ({
	points,
	center,
	zoom,
	tileSize,
	density,
	thresholdDp,
}: {
	points: RoutingPoint[];
	center: [number, number];
	zoom: number;
	tileSize: number;
	density: number;
	thresholdDp: number;
}): { pointId: number } | null => {
	let best: { pointId: number } | null = null;
	let bestDistance = thresholdDp;

	points.forEach((point) => {
		const [dx, dy] = projectLngLatToCenterDpOffset(
			center,
			[point.geometry.coordinates[0], point.geometry.coordinates[1]],
			zoom,
			tileSize,
			density
		);
		const distance = Math.hypot(dx, dy);
		if (distance < bestDistance) {
			bestDistance = distance;
			best = { pointId: point.id };
		}
	});

	return best;
};

/**
 * Fetch coordinates from BRouter, with optional compression fallback.
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

	// When a custom .brf profile file is selected, read its content once
	// and pass it as remoteProfile. BRouter then ignores v + fast.
	// A missing/unreadable file rejects with an i18n key, which is stored
	// as segment.errorMsg and rendered by PointsList / RoutingMapView.
	let remoteProfile: string | undefined;
	if (opts.profilePath) {
		try {
			remoteProfile = await readFile(opts.profilePath, 'utf8');
		} catch {
			throw 'routing.profileFileMissing';
		}
	}

	const getRequestParams = (
		extra: { compressGpxToJson?: boolean } = {}
	): Parameters<typeof getRoute>[0] =>
		remoteProfile
			? {
					waypoints,
					remoteProfile,
					format: 'json',
					...extra,
				}
			: {
					waypoints,
					vehicle: opts.v,
					fast: opts.fast,
					format: 'json',
					...extra,
				};

	/**
	 * Fetch via the uncompressed JSON path (mode `off`).
	 */
	const fetchUncompressed = (): Promise<number[][]> =>
		new Promise<number[][]>((resolve, reject) => {
			getRoute(getRequestParams())
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
		const result = await getRoute(
			getRequestParams({
				compressGpxToJson: true,
			})
		);

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

		// Enrich with elevation from the app's DEM data. Graceful like
		// getStraightLineCoords: without a wired map handle the route must
		// not hard-fail — coordinates keep z = 0.
		const handle = altitudeService.getHandle();
		if (handle) {
			await enrichCoordinatesWithElevation(coords, handle);
		}

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
	// Sanitize the interval: NaN / <= 0 (e.g. corrupted persisted
	// profiles) would produce `numSegments = NaN` and a two-point line.
	const interval =
		Number.isFinite(opts?.interval) && (opts?.interval ?? 0) > 0
			? (opts.interval as number)
			: 1000;
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

	// Enrich with altitude. Never fatal: without a wired map handle (or
	// on enrichment errors) the intervals keep z = 0 — the route itself
	// must not fail.
	try {
		const handle = altitudeService.getHandle();
		if (handle) {
			await enrichCoordinatesWithElevation(coords, handle);
		}
	} catch (err) {
		logError('routing/getStraightLineCoords', err);
	}

	// Fallback: when the bulk enrichment failed (or left the majority of
	// elevations unset, e.g. the preload fence timed out on a busy
	// executor), retry per coordinate through the retrying altitude
	// lookup the dashboard widget uses. Gated on a plausible fraction of
	// missing elevations so genuinely sea-level coordinates (coastal
	// routes) don't trigger thousands of sequential round-trips, and
	// parallelized in bounded batches.
	const zeroCount = coords.filter((c) => c[2] === 0).length;
	if (zeroCount > coords.length * 0.5) {
		const handle = altitudeService.getHandle();
		if (handle && typeof handle.getAltitudeAtPositionRetry === 'function') {
			const missing = coords.filter((c) => c[2] === 0);
			const batchSize = 20;
			for (let i = 0; i < missing.length; i += batchSize) {
				await Promise.all(
					missing.slice(i, i + batchSize).map(async (c) => {
						try {
							const alt = await handle.getAltitudeAtPositionRetry(c[0], c[1]);
							if (alt != null) {
								c[2] = alt;
							}
						} catch {
							// Keep 0 — no elevation for this coordinate.
						}
					})
				);
			}
		}
	}

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
