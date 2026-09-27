/**
 * External dependencies
 */
import { calculateSlope, interpolateColor } from 'react-native-mapsforge-vtm-ext-path-color-ramp';

/**
 * Internal dependencies
 */
import { haversineDistance } from '../../lib/formatting';

export interface ChartSeries {
	/** Cumulative haversine distance per point (metres). */
	distances: number[];
	/** Elevation per point (metres). */
	elevations: number[];
	/** Slope per point (degrees), mapped from per-segment values. */
	slopes: number[];
}

// ── Viewport (pan/zoom) helpers ────────────────────────────────────────

export interface ViewportTransform {
	scale: number;
	translateX: number;
	translateY: number;
}

/**
 * Clamps a translation along one axis for the given scale: the content
 * can never move past its edges ([plotSize * (1 - scale), 0] at scale >= 1).
 */
export const clampTranslate = (plotSize: number, scale: number, translate: number): number =>
	Math.min(0, Math.max(plotSize * (1 - scale), translate));

/**
 * Derives the viewport transform after zooming to `newScale`, keeping the
 * given focal point (plot-local coordinates) anchored to its screen
 * position. `base` must be the transform at the start of the gesture.
 */
export const zoomAroundPoint = (
	base: ViewportTransform,
	focal: { x: number; y: number },
	newScale: number,
	plotSize: { width: number; height: number },
	maxScale: number
): ViewportTransform => {
	const scale = Math.min(maxScale, Math.max(1, newScale));
	const k = scale / base.scale;
	return {
		scale,
		translateX: clampTranslate(
			plotSize.width,
			scale,
			focal.x - k * (focal.x - base.translateX)
		),
		translateY: clampTranslate(
			plotSize.height,
			scale,
			focal.y - k * (focal.y - base.translateY)
		),
	};
};

/**
 * Derives the chart series from route coordinates ([lng, lat, z][]).
 * Returns undefined when there aren't at least two coordinates.
 * Stats are intentionally NOT computed here — the stats row uses the
 * DB (SpatiaLite) values via LineStats to stay consistent with the
 * rest of the app.
 */
export const getChartSeries = (coordinates: number[][]): ChartSeries | undefined => {
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

	return {
		distances,
		elevations,
		slopes,
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

// ── Color ramps (slope + elevation) and color-run path building ───────

const clampNum = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export interface ColorStop {
	value: number;
	color: string;
}

// Slope ramp stops in degrees (percent stops converted, like the map ramp).
export const SLOPE_STOPS: ColorStop[] = [
	{ value: -11.31, color: '#00004d' },
	{ value: -7.41, color: '#000080' },
	{ value: -4, color: '#0000ff' },
	{ value: -1.15, color: '#00e8ff' },
	{ value: 0, color: '#00ff00' },
	{ value: 1.15, color: '#FFDE02' },
	{ value: 4, color: '#ff0000' },
	{ value: 7.41, color: '#800000' },
	{ value: 11.31, color: '#4d0000' },
];

export const slopeToColor = (slope: number): string => {
	const min = SLOPE_STOPS[0].value;
	const max = SLOPE_STOPS[SLOPE_STOPS.length - 1].value;
	const v = clampNum(slope, min, max);
	for (const stop of SLOPE_STOPS) {
		if (v === stop.value) {
			return stop.color;
		}
	}
	for (let i = 0; i < SLOPE_STOPS.length - 1; i++) {
		const a = SLOPE_STOPS[i];
		const b = SLOPE_STOPS[i + 1];
		if (v > a.value && v < b.value) {
			return interpolateColor(a.color, b.color, (v - a.value) / (b.value - a.value));
		}
	}
	return SLOPE_STOPS[SLOPE_STOPS.length - 1].color;
};

// Hypsometric elevation ramp, low → high.
export const ELEVATION_RAMP = [
	'#1a9850', // green
	'#a6d96a',
	'#fee08b', // yellow
	'#fc8d59', // orange
	'#d73027', // red
	'#ffffff', // white
];

/**
 * Samples a color from an equally-spaced ramp at position t (0..1).
 * Deterministic at the endpoints.
 */
export const rampColor = (t: number, ramp: string[]): string => {
	if (t <= 0 || ramp.length < 2) {
		return ramp[0];
	}
	if (t >= 1) {
		return ramp[ramp.length - 1];
	}
	const pos = t * (ramp.length - 1);
	const i = Math.min(Math.floor(pos), ramp.length - 2);
	return interpolateColor(ramp[i], ramp[i + 1], pos - i);
};

/**
 * Colors an elevation by the hypsometric ramp, normalized across
 * [min, max] of the series' own data.
 */
export const elevationToColor = (elevation: number, min: number, max: number): string =>
	rampColor(max === min ? 0.5 : (elevation - min) / (max - min), ELEVATION_RAMP);

export interface ColorRun {
	color: string;
	d: string;
}

/**
 * Builds quantized, batched color-run paths for a series path
 * (`xs`/`ys`) colored by per-segment `values` through `colorForValue`.
 * Consecutive segments with the same color are merged into one path.
 */
export const buildColorRuns = (
	xs: number[],
	ys: number[],
	values: number[],
	colorForValue: (value: number) => string,
	bucketCount = 12
): ColorRun[] => {
	const runs: ColorRun[] = [];
	if (xs.length < 2 || !values.length) {
		return runs;
	}
	let vmin = Infinity;
	let vmax = -Infinity;
	for (const v of values) {
		if (v < vmin) {
			vmin = v;
		}
		if (v > vmax) {
			vmax = v;
		}
	}
	if (!isFinite(vmin)) {
		return runs;
	}
	const range = vmax - vmin || 1;
	const bucketColor = (v: number) => {
		const idx = clampNum(
			Math.round(((clampNum(v, vmin, vmax) - vmin) / range) * (bucketCount - 1)),
			0,
			bucketCount - 1
		);
		return colorForValue(vmin + (range * idx) / (bucketCount - 1));
	};

	let currentColor = '';
	let currentD = '';
	for (let i = 0; i < xs.length - 1; i++) {
		const color = bucketColor(values[Math.min(i, values.length - 1)]);
		const seg = `M ${xs[i]} ${ys[i]} L ${xs[i + 1]} ${ys[i + 1]} `;
		if (color === currentColor) {
			currentD += seg;
		} else {
			if (currentD) {
				runs.push({ color: currentColor, d: currentD });
			}
			currentColor = color;
			currentD = seg;
		}
	}
	if (currentD) {
		runs.push({ color: currentColor, d: currentD });
	}
	return runs;
};
