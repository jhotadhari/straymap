/**
 * Tests for line-follow progress math.
 */

/**
 * Internal dependencies
 */
import { computeProgress, cumulativeDistances, nearestIdxToPoint } from '../progress';

describe('cumulativeDistances', () => {
	it('returns [0] for a single point', () => {
		expect(
			cumulativeDistances([
				[
					0,
					0,
				],
			])
		).toEqual([0]);
	});

	it('accumulates increasing distances', () => {
		const d = cumulativeDistances([
			[
				0,
				0,
			],
			[
				0,
				0.001,
			],
			[
				0,
				0.003,
			],
		]);
		expect(d).toHaveLength(3);
		expect(d[0]).toBe(0);
		expect(d[1]).toBeGreaterThan(0);
		expect(d[2]).toBeGreaterThan(d[1]);
	});
});

describe('nearestIdxToPoint', () => {
	it('finds the nearest coordinate index', () => {
		const coords = [
			[
				0,
				0,
			],
			[
				1,
				0,
			],
			[
				2,
				0,
			],
		];
		expect(nearestIdxToPoint(coords, [1.1, 0])).toBe(1);
		expect(nearestIdxToPoint(coords, [2.5, 0])).toBe(2);
	});
});

describe('computeProgress', () => {
	it('returns undefined for fewer than two coordinates', () => {
		expect(computeProgress([], [0, 0])).toBeUndefined();
		expect(
			computeProgress(
				[
					[
						0,
						0,
					],
				],
				[0, 0]
			)
		).toBeUndefined();
	});

	it('computes covered and remaining distance consistently', () => {
		const coords = [
			[
				0,
				0,
				0,
			],
			[
				0,
				0.001,
				10,
			],
			[
				0,
				0.003,
				30,
			],
			[
				0,
				0.006,
				20,
			],
		];
		const p = computeProgress(coords, [0, 0.003]);
		expect(p).toBeDefined();
		expect(p!.nearestIdx).toBe(2);
		expect(p!.distanceCovered).toBeGreaterThan(0);
		expect(p!.distanceToDestination).toBeGreaterThan(0);
		expect(p!.distanceCovered + p!.distanceToDestination).toBeCloseTo(
			cumulativeDistances(coords)[3]
		);
	});

	it('computes climb and descent over the remaining segments', () => {
		const coords = [
			[
				0,
				0,
				0,
			],
			[
				0,
				0.001,
				0,
			],
			[
				0,
				0.002,
				10,
			],
			[
				0,
				0.003,
				20,
			],
			[
				0,
				0.004,
				5,
			],
		];
		const p = computeProgress(coords, [0, 0.001]);
		expect(p!.nearestIdx).toBe(1);
		expect(p!.climbToDestination).toBeCloseTo(20);
		expect(p!.descentToDestination).toBeCloseTo(15);
	});
});
