/**
 * Tests for trackRecording pure utils.
 */

/**
 * Internal dependencies
 */
import {
	computeTrackSummary,
	createDeferredRefresh,
	deriveSpeedMps,
	segmentLengthM,
	toTrackCoord,
} from '../utils';
import { haversineLineLength } from '../../../lib/formatting';

describe('segmentLengthM', () => {
	it('sums to the full haversine line length', () => {
		const coords = [
			[
				8.0,
				50.0,
				0,
			],
			[
				8.001,
				50.001,
				5,
			],
			[
				8.003,
				50.002,
				9,
			],
		];
		const incremental =
			segmentLengthM(coords[0], coords[1]) + segmentLengthM(coords[1], coords[2]);
		expect(incremental).toBeCloseTo(haversineLineLength(coords), 6);
		expect(segmentLengthM(coords[0], coords[0])).toBe(0);
	});
});

describe('createDeferredRefresh', () => {
	it('flushes immediately while the app is active', () => {
		const flush = jest.fn();
		const d = createDeferredRefresh(() => true);
		d.request(7, flush);
		expect(flush).toHaveBeenCalledWith(7);
		expect(d.getPendingLineId()).toBeNull();
	});

	it('defers while backgrounded and flushes once on foreground', () => {
		let active = false;
		const flush = jest.fn();
		const d = createDeferredRefresh(() => active);
		d.request(7, flush);
		d.request(7, flush);
		d.request(7, flush);
		expect(flush).not.toHaveBeenCalled();
		expect(d.getPendingLineId()).toBe(7);

		active = true;
		d.flushPending(flush);
		expect(flush).toHaveBeenCalledTimes(1);
		expect(flush).toHaveBeenCalledWith(7);
		expect(d.getPendingLineId()).toBeNull();

		// Nothing dirty → no further flush.
		d.flushPending(flush);
		expect(flush).toHaveBeenCalledTimes(1);
	});

	it('flushes the remembered line when the active line changes while dirty', () => {
		const flush = jest.fn();
		const d = createDeferredRefresh(() => false);
		d.request(7, flush);
		d.request(9, flush);
		expect(flush).toHaveBeenCalledWith(7);
		expect(d.getPendingLineId()).toBe(9);
	});

	it('discard clears the dirty flag without flushing', () => {
		const flush = jest.fn();
		const d = createDeferredRefresh(() => false);
		d.request(7, flush);
		d.discard();
		d.flushPending(flush);
		expect(flush).not.toHaveBeenCalled();
	});
});

describe('toTrackCoord', () => {
	it('keeps a numeric altitude', () => {
		expect(toTrackCoord(1.5, 2.5, 123)).toEqual([
			1.5,
			2.5,
			123,
		]);
	});

	it('falls back to 0 for null altitude', () => {
		expect(toTrackCoord(1.5, 2.5, null)).toEqual([
			1.5,
			2.5,
			0,
		]);
	});

	it('falls back to 0 for undefined altitude', () => {
		expect(toTrackCoord(1.5, 2.5, undefined)).toEqual([
			1.5,
			2.5,
			0,
		]);
	});

	it('keeps 0 altitude', () => {
		expect(toTrackCoord(1.5, 2.5, 0)).toEqual([
			1.5,
			2.5,
			0,
		]);
	});

	it('always returns exactly 3 numbers', () => {
		const coord = toTrackCoord(8, 50, null);
		expect(coord).toHaveLength(3);
		coord.forEach((v) => expect(typeof v).toBe('number'));
	});
});

describe('deriveSpeedMps', () => {
	// 1 degree of latitude ≈ 111.32 km.
	const DEGREE_M = 111320;

	it('derives speed from distance over timestamp delta', () => {
		const speed = deriveSpeedMps(
			{ lng: 0, lat: 0, timestamp: 1000 },
			{ lng: 0, lat: 0.001, timestamp: 2000 }
		);
		expect(speed).not.toBeNull();
		// 0.001° over 1 s — within 2% of 111.32 m/s.
		expect(speed as number).toBeGreaterThan(DEGREE_M * 0.001 * 0.98);
		expect(speed as number).toBeLessThan(DEGREE_M * 0.001 * 1.02);
	});

	it('returns null for equal timestamps', () => {
		expect(
			deriveSpeedMps(
				{ lng: 0, lat: 0, timestamp: 1000 },
				{ lng: 0, lat: 0.001, timestamp: 1000 }
			)
		).toBeNull();
	});

	it('returns null for backwards timestamps (clock adjustments)', () => {
		expect(
			deriveSpeedMps(
				{ lng: 0, lat: 0, timestamp: 2000 },
				{ lng: 0, lat: 0.001, timestamp: 1000 }
			)
		).toBeNull();
	});
});

describe('computeTrackSummary', () => {
	// 0.001° lat ≈ 111.32 m.
	const DEGREE_M = 111320;

	it('computes distance, ascent and point count from geometry', () => {
		const summary = computeTrackSummary(
			[
				[
					0,
					0,
					10,
				],
				[
					0,
					0.001,
					20,
				],
				[
					0,
					0.002,
					15,
				],
			],
			[]
		);
		expect(summary.pointCount).toBe(3);
		expect(summary.distanceM).toBeCloseTo(2 * DEGREE_M * 0.001, 0);
		expect(summary.ascentM).toBe(10);
		expect(summary.descentM).toBe(5);
		expect(summary.minElevation).toBe(10);
		expect(summary.maxElevation).toBe(20);
	});

	it('sums moving duration, counts large gaps as pauses, and derives avg speed', () => {
		const points = [
			{ point_index: 0, timestamp: 0, speed: null },
			{ point_index: 1, timestamp: 2_000, speed: 2 },
			{ point_index: 2, timestamp: 4_000, speed: 1.5 },
			// 60 s gap — treated as a pause.
			{ point_index: 3, timestamp: 64_000, speed: null },
			{ point_index: 4, timestamp: 66_000, speed: 3 },
		];
		const summary = computeTrackSummary(
			[
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
					0,
				],
				[
					0,
					0.003,
					0,
				],
				[
					0,
					0.004,
					0,
				],
			],
			points
		);
		expect(summary.startTime).toBe(0);
		expect(summary.endTime).toBe(66_000);
		expect(summary.totalDurationMs).toBe(66_000);
		// 2s + 2s + 2s — the 60 s gap is excluded.
		expect(summary.movingDurationMs).toBe(6_000);
		expect(summary.pauseDurationMs).toBe(60_000);
		expect(summary.maxSpeedMps).toBe(3);
		const expectedAvg = summary.distanceM / 6; // m / s
		expect(summary.avgSpeedMps).toBeCloseTo(expectedAvg, 1);
	});

	it('handles empty input', () => {
		const summary = computeTrackSummary([], []);
		expect(summary.pointCount).toBe(0);
		expect(summary.startTime).toBeNull();
		expect(summary.endTime).toBeNull();
		expect(summary.totalDurationMs).toBeNull();
		expect(summary.movingDurationMs).toBeNull();
		expect(summary.avgSpeedMps).toBeNull();
		expect(summary.maxSpeedMps).toBeNull();
	});
});
