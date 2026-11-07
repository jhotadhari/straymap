/**
 * Tests for the stats modal aggregation helpers.
 */

/**
 * Internal dependencies
 */
import { aggregateLineStats } from '../components/Stats/sharedDeps';
import {
	aggregateTrackingStats,
	EMPTY_TRACKING_STATS,
} from '../components/Stats/LineTrackingStatsRows';
import { LineTrackPointsStats } from '../../trackRecording/db/queryFns';

describe('aggregateLineStats', () => {
	it('sums additive fields and takes elevation extremes', () => {
		const aggregated = aggregateLineStats([
			{ stats: { length: 100, uphill: 10, downhill: 5, minZ: 10, maxZ: 50 } },
			{ stats: { length: 250, uphill: 20, downhill: 30, minZ: 40, maxZ: 70 } },
		]);
		expect(aggregated).toEqual({
			length: 350,
			uphill: 30,
			downhill: 35,
			minZ: 10,
			maxZ: 70,
		});
	});

	it('ignores lines without stats and partial stats objects', () => {
		const aggregated = aggregateLineStats([
			{},
			{ stats: { length: 100, uphill: 10 } },
			{ stats: { minZ: 5 } },
		]);
		expect(aggregated).toEqual({ length: 100, uphill: 10, minZ: 5 });
	});

	it('returns an empty object for no input', () => {
		expect(aggregateLineStats([])).toEqual({});
	});
});

describe('aggregateTrackingStats', () => {
	const stats = (
		over: Partial<LineTrackPointsStats>
	): { lineId: number; stats: LineTrackPointsStats } => ({
		lineId: 1,
		stats: {
			lineId: 1,
			count: 10,
			maxSpeed: 12,
			startTs: 1000,
			endTs: 61000,
			movingDurationMs: 50000,
			...over,
		},
	});

	it('sums durations, points and moving time; takes the max speed', () => {
		const { values, coveredCount, totalCount } = aggregateTrackingStats(
			[
				stats({ lineId: 1 }),
				stats({
					lineId: 2,
					count: 5,
					maxSpeed: 20,
					startTs: 2000,
					endTs: 32000,
					movingDurationMs: 25000,
				}),
			],
			2
		);
		expect(values.durationMs).toBe(90000);
		expect(values.movingMs).toBe(75000);
		expect(values.pauseMs).toBe(15000);
		expect(values.maxSpeedMps).toBe(20);
		expect(values.pointCount).toBe(15);
		expect(coveredCount).toBe(2);
		expect(totalCount).toBe(2);
	});

	it('reports partial coverage when some selected lines have no metadata', () => {
		const { values, coveredCount, totalCount } = aggregateTrackingStats([stats({})], 3);
		expect(coveredCount).toBe(1);
		expect(totalCount).toBe(3);
		expect(values.pointCount).toBe(10);
	});

	it('returns the empty baseline for no metadata entries', () => {
		const { values, coveredCount } = aggregateTrackingStats([], 2);
		expect(coveredCount).toBe(0);
		expect(values).toEqual(EMPTY_TRACKING_STATS);
	});
});
