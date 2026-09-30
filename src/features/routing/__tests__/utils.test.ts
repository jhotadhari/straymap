/**
 * Tests for src/store/features/routing/utils.ts — pure utility functions.
 */

import { readFile } from 'react-native-fs';
import { getRoute } from 'react-native-brouter/geojson';
import { getSegmentRecordId, aggregateSegmentsToCoords } from '../../../features/routing/utils';

jest.mock('react-native-fs', () => ({
	readFile: jest.fn(),
}));

jest.mock('react-native-brouter/geojson', () => ({
	getRoute: jest.fn(),
}));

/**
 * Internal dependencies
 */
import type { RoutingSegment } from '../../../features/routing/types';

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
