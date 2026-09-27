/**
 * Tests for chart utils (chart series + axis ticks).
 */

/**
 * Internal dependencies
 */
import {
	buildColorRuns,
	clampTranslate,
	ELEVATION_RAMP,
	elevationToColor,
	getNiceTicks,
	getChartSeries,
	SLOPE_STOPS,
	slopeToColor,
	zoomAroundPoint,
} from '../utils';

describe('getChartSeries', () => {
	it('returns undefined for fewer than two coordinates', () => {
		expect(getChartSeries([])).toBeUndefined();
		expect(
			getChartSeries([
				[
					0,
					0,
					10,
				],
			])
		).toBeUndefined();
	});

	it('derives distances, elevations and slopes', () => {
		// Two points ~111m apart (0.001° latitude).
		const series = getChartSeries([
			[
				0,
				0,
				100,
			],
			[
				0,
				0.001,
				110,
			],
			[
				0,
				0.002,
				95,
			],
		]);
		expect(series).toBeDefined();
		expect(series!.elevations).toEqual([
			100,
			110,
			95,
		]);
		expect(series!.distances[0]).toBe(0);
		expect(series!.distances[1]).toBeGreaterThan(100);
		expect(series!.distances[2]).toBeGreaterThan(series!.distances[1]);
		expect(series!.slopes).toHaveLength(3);
	});
});

describe('getNiceTicks', () => {
	it('returns a single tick for a zero range', () => {
		expect(getNiceTicks(5, 5)).toEqual([5]);
	});

	it('returns empty for non-finite input', () => {
		expect(getNiceTicks(NaN, 10)).toEqual([]);
		expect(getNiceTicks(0, Infinity)).toEqual([]);
	});

	it('produces round steps covering the range', () => {
		const ticks = getNiceTicks(9, 27, 5);
		expect(ticks[0]).toBeGreaterThanOrEqual(9);
		expect(ticks[ticks.length - 1]).toBeLessThanOrEqual(27 + 1e-6);
		// Steps should be "nice" (multiples of 1/2/5×10^n) — e.g. 10,15,20,25.
		expect(ticks).toContain(10);
		expect(ticks).toContain(15);
		expect(ticks).toContain(20);
		expect(ticks).toContain(25);
	});

	it('handles negative ranges', () => {
		const ticks = getNiceTicks(-21, -3, 5);
		expect(ticks[0]).toBeGreaterThanOrEqual(-21);
		expect(ticks[ticks.length - 1]).toBeLessThanOrEqual(-3 + 1e-6);
	});
});

describe('clampTranslate', () => {
	it('keeps translations within the plot bounds', () => {
		expect(clampTranslate(300, 2, 100)).toBe(0);
		expect(clampTranslate(300, 2, -400)).toBe(-300);
		expect(clampTranslate(300, 2, -100)).toBe(-100);
	});

	it('forces zero translation at scale 1', () => {
		expect(clampTranslate(300, 1, 50)).toBe(0);
		expect(clampTranslate(300, 1, -50)).toBe(0);
	});
});

describe('zoomAroundPoint', () => {
	const base = { scale: 1, translateX: 0, translateY: 0 };

	it('keeps the focal point anchored when zooming in', () => {
		const next = zoomAroundPoint(base, { x: 100, y: 50 }, 2, { width: 300, height: 200 }, 20);
		expect(next.scale).toBe(2);
		// The content point under the focal stays at the focal's screen position.
		expect(next.translateX + 2 * 100).toBeCloseTo(100);
		expect(next.translateY + 2 * 50).toBeCloseTo(50);
	});

	it('zooms from a panned base', () => {
		const panned = { scale: 2, translateX: -150, translateY: -60 };
		const focal = { x: 120, y: 40 };
		const next = zoomAroundPoint(panned, focal, 4, { width: 300, height: 200 }, 20);
		expect(next.scale).toBe(4);
		// Content point under the focal: (focal - translate) / scale.
		const contentX = (focal.x - panned.translateX) / panned.scale;
		const contentY = (focal.y - panned.translateY) / panned.scale;
		expect(next.translateX + 4 * contentX).toBeCloseTo(focal.x);
		expect(next.translateY + 4 * contentY).toBeCloseTo(focal.y);
	});

	it('clamps scale to [1, maxScale]', () => {
		const below = zoomAroundPoint(base, { x: 0, y: 0 }, 0.5, { width: 300, height: 200 }, 20);
		expect(below.scale).toBe(1);
		const above = zoomAroundPoint(base, { x: 0, y: 0 }, 42, { width: 300, height: 200 }, 20);
		expect(above.scale).toBe(20);
	});

	it('clamps the resulting translation', () => {
		const next = zoomAroundPoint(base, { x: 0, y: 0 }, 20, { width: 300, height: 200 }, 20);
		expect(next.translateX).toBeGreaterThanOrEqual(300 * (1 - 20));
		expect(next.translateX).toBeLessThanOrEqual(0);
		expect(next.translateY).toBeGreaterThanOrEqual(200 * (1 - 20));
		expect(next.translateY).toBeLessThanOrEqual(0);
	});
});

describe('slopeToColor', () => {
	it('maps zero slope to the green stop', () => {
		expect(slopeToColor(0)).toBe('#00ff00');
	});

	it('clamps extreme values to the ramp ends', () => {
		expect(slopeToColor(-20)).toBe('#00004d');
		expect(slopeToColor(100)).toBe(SLOPE_STOPS[SLOPE_STOPS.length - 1].color);
	});
});

describe('elevationToColor', () => {
	it('maps the data minimum to the first ramp color', () => {
		expect(elevationToColor(0, 0, 10)).toBe(ELEVATION_RAMP[0]);
	});

	it('maps the data maximum to the last ramp color', () => {
		expect(elevationToColor(10, 0, 10)).toBe(ELEVATION_RAMP[ELEVATION_RAMP.length - 1]);
	});

	it('maps the midpoint into the ramp', () => {
		expect(elevationToColor(5, 0, 10)).toBe(ELEVATION_RAMP[2]);
	});

	it('handles a flat domain', () => {
		expect(elevationToColor(42, 42, 42)).toBe(ELEVATION_RAMP[2]);
	});
});

describe('buildColorRuns', () => {
	const xs = [
		0,
		1,
		2,
	];
	const ys = [
		10,
		20,
		30,
	];
	const colorForValue = (v: number) => (v > 50 ? 'red' : 'green');

	it('batches same-colored segments into one run', () => {
		const runs = buildColorRuns(xs, ys, [0, 0], colorForValue);
		expect(runs).toHaveLength(1);
		expect(runs[0].color).toBe('green');
		expect(runs[0].d).toContain('M 0 10');
		expect(runs[0].d).toContain('L 2 30');
	});

	it('splits differently-colored segments into separate runs', () => {
		const runs = buildColorRuns(xs, ys, [0, 100], colorForValue);
		expect(runs).toHaveLength(2);
		expect(runs[0].color).toBe('green');
		expect(runs[1].color).toBe('red');
	});

	it('returns no runs for too few points', () => {
		expect(buildColorRuns([1], [1], [0], colorForValue)).toEqual([]);
	});
});
