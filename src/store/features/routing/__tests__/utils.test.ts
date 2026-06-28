/**
 * Tests for src/store/features/routing/utils.ts — pure utility functions.
 */

import {
	getSegmentRecordId,
	aggregateSegmentsToCoords,
} from '../../../../store/features/routing/utils';
import type { RoutingSegment } from '../../../../store/features/routing/types';

// ===========================================================================
// getSegmentRecordId
// ===========================================================================

describe('getSegmentRecordId', () => {
	it('joins fromId and toId with underscore', () => {
		const segment = { fromId: 1, toId: 2 };
		expect(getSegmentRecordId(segment)).toBe('1_2');
	});

	it('handles string IDs', () => {
		const segment = { fromId: 'a', toId: 'b' };
		expect(getSegmentRecordId(segment as any)).toBe('a_b');
	});

	it('handles zero IDs', () => {
		const segment = { fromId: 0, toId: 0 };
		expect(getSegmentRecordId(segment)).toBe('0_0');
	});

	it('handles negative IDs', () => {
		const segment = { fromId: -1, toId: -2 };
		expect(getSegmentRecordId(segment)).toBe('-1_-2');
	});
});

// ===========================================================================
// aggregateSegmentsToCoords
// ===========================================================================

describe('aggregateSegmentsToCoords', () => {
	it('flattens positions from multiple segments', () => {
		const segments: RoutingSegment[] = [
			{
				fromId: 0,
				toId: 1,
				positions: [
					[0, 0],
					[1, 1],
				],
			},
			{
				fromId: 1,
				toId: 2,
				positions: [
					[1, 1],
					[2, 2],
				],
			},
		];
		const result = aggregateSegmentsToCoords(segments);
		expect(result).toEqual([
			[0, 0],
			[1, 1],
			[1, 1],
			[2, 2],
		]);
	});

	it('skips segments with null/undefined positions', () => {
		const segments: RoutingSegment[] = [
			{ fromId: 0, toId: 1, positions: [[0, 0]] },
			{ fromId: 1, toId: 2 }, // no positions
			{ fromId: 2, toId: 3, positions: [[2, 2]] },
		];
		const result = aggregateSegmentsToCoords(segments);
		expect(result).toEqual([[0, 0], [2, 2]]);
	});

	it('returns empty array for empty segments', () => {
		expect(aggregateSegmentsToCoords([])).toEqual([]);
	});

	it('returns empty array when all segments have no positions', () => {
		const segments: RoutingSegment[] = [
			{ fromId: 0, toId: 1 },
			{ fromId: 1, toId: 2 },
		];
		expect(aggregateSegmentsToCoords(segments)).toEqual([]);
	});

	it('handles segments with empty positions arrays', () => {
		const segments: RoutingSegment[] = [
			{ fromId: 0, toId: 1, positions: [] },
			{ fromId: 1, toId: 2, positions: [[1, 1]] },
		];
		const result = aggregateSegmentsToCoords(segments);
		expect(result).toEqual([[1, 1]]);
	});

	it('handles 3D coordinates', () => {
		const segments: RoutingSegment[] = [
			{
				fromId: 0,
				toId: 1,
				positions: [
					[0, 0, 100],
					[1, 1, 200],
				],
			},
		];
		const result = aggregateSegmentsToCoords(segments);
		expect(result).toEqual([
			[0, 0, 100],
			[1, 1, 200],
		]);
	});
});
