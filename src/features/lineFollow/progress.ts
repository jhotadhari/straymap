/**
 * Internal dependencies
 */
import { haversineDistance } from '../../lib/formatting';

/**
 * Pure progress-tracking math for a followed line. Coordinates are
 * `[lng, lat, z?][]` (GeoJSON LineString positions) — the same shape the
 * chart and map consumers already use. All distances are metres; climb and
 * descent are vertical metres summed over the remaining segments.
 */
export interface LineProgress {
	/** Cumulative distance from the line start to the nearest point. */
	distanceCovered: number;
	/** Cumulative distance from the nearest point to the line end. */
	distanceToDestination: number;
	/** Sum of positive elevation deltas over [nearestIdx..end]. */
	climbToDestination: number;
	/** Sum of negative elevation deltas over [nearestIdx..end] (positive). */
	descentToDestination: number;
	/** Index of the coordinate nearest to the target position. */
	nearestIdx: number;
}

/**
 * Cumulative haversine distance per point (metres). First entry is 0.
 */
export const cumulativeDistances = (coordinates: number[][]): number[] => {
	const distances: number[] = [0];
	let length = 0;
	for (let i = 1; i < coordinates.length; i++) {
		length += haversineDistance(
			[coordinates[i - 1][0], coordinates[i - 1][1]],
			[coordinates[i][0], coordinates[i][1]]
		);
		distances.push(length);
	}
	return distances;
};

/**
 * Index of the coordinate nearest to `target` (exhaustive O(n) scan).
 */
export const nearestIdxToPoint = (coordinates: number[][], target: [number, number]): number => {
	const n = coordinates.length;
	let best = -1;
	let bestDist = Infinity;
	for (let i = 0; i < n; i++) {
		const d = haversineDistance([coordinates[i][0], coordinates[i][1]], target);
		if (d < bestDist) {
			bestDist = d;
			best = i;
		}
	}
	return best;
};

/**
 * Computes the follow-progress stats for a line given the current position.
 * Returns undefined when there aren't at least two coordinates.
 */
export const computeProgress = (
	coordinates: number[][],
	target: [number, number]
): LineProgress | undefined => {
	if (!coordinates || coordinates.length < 2) {
		return undefined;
	}
	const distances = cumulativeDistances(coordinates);
	const nearestIdx = nearestIdxToPoint(coordinates, target);
	if (nearestIdx < 0) {
		return undefined;
	}
	const total = distances[distances.length - 1] ?? 0;
	const distanceCovered = distances[nearestIdx] ?? 0;
	const distanceToDestination = Math.max(0, total - distanceCovered);

	let climbToDestination = 0;
	let descentToDestination = 0;
	for (let i = nearestIdx + 1; i < coordinates.length; i++) {
		const dz = (coordinates[i][2] ?? 0) - (coordinates[i - 1][2] ?? 0);
		if (dz > 0) {
			climbToDestination += dz;
		} else {
			descentToDestination += -dz;
		}
	}

	return {
		distanceCovered,
		distanceToDestination,
		climbToDestination,
		descentToDestination,
		nearestIdx,
	};
};
