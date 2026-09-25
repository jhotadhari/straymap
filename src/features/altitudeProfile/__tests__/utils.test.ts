/**
 * Tests for altitudeProfile utils (profile series + axis ticks).
 */

/**
 * Internal dependencies
 */
import { getNiceTicks, getProfileSeries } from '../utils';

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

	it('derives distances, elevations and stats', () => {
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
		expect(series!.stats.uphill).toBeCloseTo(10);
		expect(series!.stats.downhill).toBeCloseTo(15);
		expect(series!.stats.minZ).toBe(95);
		expect(series!.stats.maxZ).toBe(110);
		expect(series!.stats.length).toBeGreaterThan(200);
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
