/**
 * External dependencies
 */
import { calculateSlope } from 'react-native-mapsforge-vtm-ext-path-color-ramp';

/**
 * Internal dependencies
 */
import { haversineDistance } from '../../lib/formatting';

export interface ProfileStats {
	length: number;
	uphill: number;
	downhill: number;
	minZ: number;
	maxZ: number;
}

export interface ProfileSeries {
	/** Cumulative haversine distance per point (metres). */
	distances: number[];
	/** Elevation per point (metres). */
	elevations: number[];
	/** Slope per point (degrees), mapped from per-segment values. */
	slopes: number[];
	stats: ProfileStats;
}

/**
 * Derives the chart series from profile coordinates ([lng, lat, z][]).
 * Returns undefined when there aren't at least two coordinates.
 */
export const getProfileSeries = (coordinates: number[][]): ProfileSeries | undefined => {
	if (!coordinates || coordinates.length < 2) {
		return undefined;
	}

	const distances: number[] = [0];
	const elevations = coordinates.map((c) => c[2] ?? 0);
	let length = 0;
	for (let i = 1; i < coordinates.length; i++) {
		length += haversineDistance(
			[coordinates[i - 1][0], coordinates[i - 1][1]],
			[coordinates[i][0], coordinates[i][1]]
		);
		distances.push(length);
	}

	// Per-segment slopes; map onto points (last point repeats the previous).
	const segmentSlopes = calculateSlope(coordinates, {
		smoothElevations: false,
		fillElevationGaps: false,
	});
	const slopes = coordinates.map(
		(_c, i) => segmentSlopes[Math.min(i, segmentSlopes.length - 1)] ?? 0
	);

	let uphill = 0;
	let downhill = 0;
	let minZ = elevations[0];
	let maxZ = elevations[0];
	for (let i = 1; i < elevations.length; i++) {
		const delta = elevations[i] - elevations[i - 1];
		if (delta > 0) {
			uphill += delta;
		} else {
			downhill -= delta;
		}
		minZ = Math.min(minZ, elevations[i]);
		maxZ = Math.max(maxZ, elevations[i]);
	}

	return {
		distances,
		elevations,
		slopes,
		stats: { length, uphill, downhill, minZ, maxZ },
	};
};

/**
 * "Nice" axis ticks (1/2/5 × 10^n steps) covering [min, max].
 */
export const getNiceTicks = (min: number, max: number, targetCount = 5): number[] => {
	if (!isFinite(min) || !isFinite(max)) {
		return [];
	}
	if (min === max) {
		return [min];
	}
	const range = max - min;
	const stepRaw = range / Math.max(1, targetCount);
	const magnitude = Math.pow(10, Math.floor(Math.log10(stepRaw)));
	const norm = stepRaw / magnitude;
	let step;
	if (norm <= 1) {
		step = 1;
	} else if (norm <= 2) {
		step = 2;
	} else if (norm <= 5) {
		step = 5;
	} else {
		step = 10;
	}
	step *= magnitude;

	const ticks: number[] = [];
	const start = Math.ceil(min / step) * step;
	for (let v = start; v <= max + step * 1e-6; v += step) {
		ticks.push(Number(v.toFixed(10)));
	}
	return ticks;
};
