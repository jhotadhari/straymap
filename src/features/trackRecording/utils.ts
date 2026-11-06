/**
 * Internal dependencies
 */
import { deriveSpeedMps, haversineDistance } from '../../lib/formatting';
import { TrackSummary } from './types';

export { deriveSpeedMps };

/**
 * Normalize a GNSS position to the app's canonical 3D coordinate
 * `[lng, lat, z]`.  Missing altitude becomes 0 — the DB schema enforces
 * POINTZ / LINESTRINGZ (3D), and mixing 2D/3D geometries makes
 * SpatiaLite's ST_AddPoint throw on every append (the recording would
 * freeze at its first two points).
 */
export const toTrackCoord = (
	lng: number,
	lat: number,
	altitude: number | null | undefined
): [
	number,
	number,
	number,
] => [
	lng,
	lat,
	altitude ?? 0,
];

/**
 * Inter-point gaps larger than this are treated as pauses (GNSS signal
 * loss, or the gap between a stopped and continued recording segment).
 */
export const PAUSE_GAP_THRESHOLD_MS = 30 * 1000;

/**
 * Compute a track's summary from its geometry (distance, ascent,
 * descent, elevation extremes — the complete spatial truth) and its
 * track_points rows (durations, speeds).  A lost metadata row is not
 * skipped — its inter-point gap is absorbed into the preceding interval,
 * which can shift that one interval across the pause threshold.
 */
export const computeTrackSummary = (
	coords: number[][],
	points: { point_index: number; timestamp: number; speed: number | null }[]
): TrackSummary => {
	let distanceM = 0;
	let ascentM = 0;
	let descentM = 0;
	let minElevation: number | null = null;
	let maxElevation: number | null = null;

	for (let i = 0; i < coords.length; i++) {
		const z = coords[i][2];
		if (typeof z === 'number') {
			minElevation = minElevation == null ? z : Math.min(minElevation, z);
			maxElevation = maxElevation == null ? z : Math.max(maxElevation, z);
		}
		if (i > 0) {
			distanceM += haversineDistance(
				[
					coords[i - 1][0],
					coords[i - 1][1],
				],
				[
					coords[i][0],
					coords[i][1],
				]
			);
			const dz = (coords[i][2] ?? 0) - (coords[i - 1][2] ?? 0);
			if (dz > 0) {
				ascentM += dz;
			} else {
				descentM += -dz;
			}
		}
	}

	const sorted = [
		...points,
	].sort((a, b) => a.point_index - b.point_index);

	let movingDurationMs = 0;
	let maxSpeedMps: number | null = null;
	for (let i = 1; i < sorted.length; i++) {
		const point = sorted[i];
		const dt = point.timestamp - sorted[i - 1].timestamp;
		if (dt > 0 && dt <= PAUSE_GAP_THRESHOLD_MS) {
			movingDurationMs += dt;
		}
		if (point.speed != null && (maxSpeedMps == null || point.speed > maxSpeedMps)) {
			maxSpeedMps = point.speed;
		}
	}

	const startTime = sorted[0]?.timestamp ?? null;
	const endTime = sorted[sorted.length - 1]?.timestamp ?? null;
	const totalDurationMs =
		startTime != null && endTime != null ? Math.max(0, endTime - startTime) : null;
	const pauseDurationMs =
		totalDurationMs != null ? Math.max(0, totalDurationMs - movingDurationMs) : null;
	const avgSpeedMps = movingDurationMs > 0 ? distanceM / (movingDurationMs / 1000) : null;

	return {
		startTime,
		endTime,
		totalDurationMs,
		movingDurationMs: sorted.length > 0 ? movingDurationMs : null,
		pauseDurationMs,
		distanceM,
		avgSpeedMps,
		maxSpeedMps,
		ascentM,
		descentM,
		pointCount: coords.length,
		minElevation,
		maxElevation,
	};
};
