/**
 * Tests for src/store/features/routing/utils.ts — pure utility functions.
 */

import { readFile } from 'react-native-fs';
import { getRoute } from 'react-native-brouter/geojson';
import {
	getSegmentRecordId,
	aggregateSegmentsToCoords,
	projectLngLatToCenterDpOffset,
	getNearestPointHit,
	getNearestSegmentHit,
} from '../../../features/routing/utils';

jest.mock('react-native-fs', () => ({
	readFile: jest.fn(),
}));

jest.mock('react-native-brouter/geojson', () => ({
	getRoute: jest.fn(),
}));

/**
 * Internal dependencies
 */
import type { RoutingSegment, RoutingPoint } from '../../../features/routing/types';

// jest.setup.js mocks ./src/features/routing/utils and stubs getCoordsFromRouting —
// grab the real implementation for these tests.
const { getCoordsFromRouting } = jest.requireActual(
	'../../../features/routing/utils'
) as typeof import('../../../features/routing/utils');

const mockReadFile = readFile as jest.Mock;
const mockGetRoute = getRoute as jest.Mock;

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
		expect(result).toEqual([
			[0, 0],
			[2, 2],
		]);
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
					[
						0,
						0,
						100,
					],
					[
						1,
						1,
						200,
					],
				],
			},
		];
		const result = aggregateSegmentsToCoords(segments);
		expect(result).toEqual([
			[
				0,
				0,
				100,
			],
			[
				1,
				1,
				200,
			],
		]);
	});
});

// ===========================================================================
// Center hit-testing helpers (gesture-workaround actions)
// ===========================================================================

const makePoint = (id: number, lng: number, lat: number): RoutingPoint => ({
	id,
	geometry: { type: 'Point', coordinates: [lng, lat] },
});

// Shared projection parameters: zoom 15, vtm tile size, density 1 —
// 1° lng ≈ 52429 dp, so the 30 dp threshold ≈ 0.000572°.
const zoom = 15;
const tileSize = 576;
const density = 1;
const thresholdDp = 30;

describe('projectLngLatToCenterDpOffset', () => {
	it('returns a zero offset for the center itself', () => {
		expect(projectLngLatToCenterDpOffset([8, 49], [8, 49], zoom, tileSize, density)).toEqual([
			0,
			0,
		]);
	});

	it('returns a positive dx east of the center', () => {
		const [dx, dy] = projectLngLatToCenterDpOffset(
			[8, 49],
			[8.001, 49],
			zoom,
			tileSize,
			density
		);
		expect(dx).toBeGreaterThan(0);
		expect(dx).toBeCloseTo(52.43, 0);
		expect(dy).toBeCloseTo(0, 5);
	});
});

describe('getNearestPointHit', () => {
	it('hits a waypoint within the threshold', () => {
		const points = [makePoint(1, 8.0005, 49)];
		const hit = getNearestPointHit({
			points,
			center: [8, 49],
			zoom,
			tileSize,
			density,
			thresholdDp,
		});
		expect(hit).toEqual({ pointId: 1 });
	});

	it('returns null when all waypoints are beyond the threshold', () => {
		const points = [makePoint(1, 8.001, 49)];
		expect(
			getNearestPointHit({ points, center: [8, 49], zoom, tileSize, density, thresholdDp })
		).toBeNull();
	});

	it('picks the nearest waypoint', () => {
		const points = [makePoint(1, 8.002, 49), makePoint(2, 8.0004, 49)];
		expect(
			getNearestPointHit({ points, center: [8, 49], zoom, tileSize, density, thresholdDp })
		).toEqual({ pointId: 2 });
	});
});

describe('getNearestSegmentHit', () => {
	it('hits a segment under the center and returns the insert index', () => {
		const points = [makePoint(1, 8, 49), makePoint(2, 8.002, 49)];
		const hit = getNearestSegmentHit({
			points,
			simplifiedByRecordId: {
				'1_2': [
					[8, 49],
					[8.001, 49],
					[8.002, 49],
				],
			},
			center: [8.001, 49],
			zoom,
			tileSize,
			density,
			thresholdDp,
		});
		expect(hit).not.toBeNull();
		expect(hit!.segmentRecordId).toBe('1_2');
		expect(hit!.insertIndex).toBe(1);
		expect(hit!.nearest[0]).toBeCloseTo(8.001, 6);
		expect(hit!.nearest[1]).toBeCloseTo(49, 6);
	});

	it('returns the correct insert index for the second segment', () => {
		const points = [
			makePoint(1, 8, 49),
			makePoint(2, 8.002, 49),
			makePoint(3, 8.004, 49),
		];
		const hit = getNearestSegmentHit({
			points,
			simplifiedByRecordId: {
				'1_2': [
					[8, 49],
					[8.002, 49],
				],
				'2_3': [
					[8.002, 49],
					[8.003, 49],
					[8.004, 49],
				],
			},
			center: [8.003, 49],
			zoom,
			tileSize,
			density,
			thresholdDp,
		});
		expect(hit).not.toBeNull();
		expect(hit!.segmentRecordId).toBe('2_3');
		expect(hit!.insertIndex).toBe(2);
	});

	it('returns null when the center is beyond the threshold', () => {
		const points = [makePoint(1, 8, 49), makePoint(2, 8.002, 49)];
		expect(
			getNearestSegmentHit({
				points,
				simplifiedByRecordId: {
					'1_2': [
						[8, 49],
						[8.002, 49],
					],
				},
				center: [8.01, 49],
				zoom,
				tileSize,
				density,
				thresholdDp,
			})
		).toBeNull();
	});

	it('ignores segments without simplified coordinates', () => {
		const points = [makePoint(1, 8, 49), makePoint(2, 8.002, 49)];
		expect(
			getNearestSegmentHit({
				points,
				simplifiedByRecordId: {},
				center: [8.001, 49],
				zoom,
				tileSize,
				density,
				thresholdDp,
			})
		).toBeNull();
	});
});

// ===========================================================================
// getCoordsFromRouting — custom .brf profile via remoteProfile
// ===========================================================================

const waypoints = [
	[8.0, 49.0],
	[8.1, 49.1],
];

const mockParsedResult = () => ({
	parsed: {
		track: {
			features: [
				{
					geometry: {
						coordinates: [
							[8.0, 49.0],
							[8.05, 49.05],
							[8.1, 49.1],
						],
					},
				},
			],
		},
	},
});

describe('getCoordsFromRouting with brouter custom profile', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('reads the .brf file and passes its content as remoteProfile', async () => {
		mockReadFile.mockResolvedValue('assign costfactor = 1');
		mockGetRoute.mockResolvedValue(mockParsedResult());

		const coords = await getCoordsFromRouting({
			waypoints,
			profile: {
				provider: 'brouter',
				options: {
					fast: true,
					v: 'bicycle',
					compressionMode: 'off',
					profilePath: '/sdcard/brouterProfiles/trekking.brf',
				},
			},
		});

		expect(mockReadFile).toHaveBeenCalledWith('/sdcard/brouterProfiles/trekking.brf', 'utf8');
		expect(mockGetRoute).toHaveBeenCalledWith({
			waypoints,
			remoteProfile: 'assign costfactor = 1',
			format: 'json',
		});
		expect(coords).toEqual([
			[8.0, 49.0],
			[8.05, 49.05],
			[8.1, 49.1],
		]);
	});

	it('rejects with the profileFileMissing i18n key when the file cannot be read', async () => {
		mockReadFile.mockRejectedValue(new Error('ENOENT'));

		await expect(
			getCoordsFromRouting({
				waypoints,
				profile: {
					provider: 'brouter',
					options: {
						fast: true,
						v: 'bicycle',
						compressionMode: 'off',
						profilePath: '/sdcard/brouterProfiles/missing.brf',
					},
				},
			})
		).rejects.toBe('routing.profileFileMissing');

		expect(mockGetRoute).not.toHaveBeenCalled();
	});

	it('uses vehicle/fast for the internal profile and never reads a file', async () => {
		mockGetRoute.mockResolvedValue(mockParsedResult());

		await getCoordsFromRouting({
			waypoints,
			profile: {
				provider: 'brouter',
				options: {
					fast: false,
					v: 'foot',
					compressionMode: 'off',
				},
			},
		});

		expect(mockReadFile).not.toHaveBeenCalled();
		expect(mockGetRoute).toHaveBeenCalledWith({
			waypoints,
			vehicle: 'foot',
			fast: false,
			format: 'json',
		});
	});

	it('passes remoteProfile in compressed mode as well', async () => {
		mockReadFile.mockResolvedValue('assign costfactor = 1');
		mockGetRoute.mockResolvedValue(mockParsedResult());

		await getCoordsFromRouting({
			waypoints,
			profile: {
				provider: 'brouter',
				options: {
					fast: true,
					v: 'motorcar',
					compressionMode: 'on',
					profilePath: '/sdcard/brouterProfiles/car-fast.brf',
				},
			},
		});

		expect(mockGetRoute).toHaveBeenCalledWith({
			waypoints,
			remoteProfile: 'assign costfactor = 1',
			format: 'json',
			compressGpxToJson: true,
		});
	});
});
