/**
 * Tests for altitudeProfile utils (profile series + axis ticks).
 */

/**
 * Internal dependencies
 */
import { clampTranslate, getNiceTicks, getProfileSeries, zoomAroundPoint } from '../utils';

describe('getProfileSeries', () => {
	it('returns undefined for fewer than two coordinates', () => {
		expect(getProfileSeries([])).toBeUndefined();
		expect(
			getProfileSeries([
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
		const series = getProfileSeries([
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
