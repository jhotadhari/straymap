/**
 * Tests for src/store/features/dbLoader/utils.ts — pure row-parsing functions.
 *
 * Functions that depend on dbConnection (withDbTransaction, dbOpExecute,
 * withDbErrorHandling) are not tested here — they require a real or fully-mocked
 * op-sqlite connection and are better covered by integration tests.
 */

/**
 * Internal dependencies
 */
import {
	rowParseGeometryGeoJSON,
	rowsParseGeometryGeoJSON,
	rowParseEnvelopeGeoJSON,
	rowsParseEnvelopeGeoJSON,
	parseReturningIds,
	withDbTransaction,
} from '../../../features/dbLoader/utils';
import { dbConnection } from '../../../features/dbLoader/DBConnection';

// Suppress expected console.log from parseSerialized error paths in __DEV__.
let logSpy: jest.SpyInstance;
beforeAll(() => {
	logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterAll(() => {
	logSpy.mockRestore();
});

// ===========================================================================
// rowParseGeometryGeoJSON
// ===========================================================================

describe('rowParseGeometryGeoJSON', () => {
	it('parses geometryGeoJSON string into geometry object', () => {
		const row = {
			id: 1,
			title: 'test',
			geometryGeoJSON: '{"type":"LineString","coordinates":[[0,0],[1,1]]}',
		};
		const result = rowParseGeometryGeoJSON(row);
		expect(result.id).toBe(1);
		expect(result.title).toBe('test');
		expect(result).not.toHaveProperty('geometryGeoJSON');
		expect(result.geometry).toEqual({
			type: 'LineString',
			coordinates: [
				[0, 0],
				[1, 1],
			],
		});
	});

	it('handles Point geometry', () => {
		const row = {
			id: 2,
			geometryGeoJSON: '{"type":"Point","coordinates":[10,20,30]}',
		};
		const result = rowParseGeometryGeoJSON(row);
		expect(result.geometry).toEqual({
			type: 'Point',
			coordinates: [
				10,
				20,
				30,
			],
		});
	});

	it('preserves other row properties', () => {
		const row = {
			id: 3,
			geometryGeoJSON: '{"type":"Point","coordinates":[0,0]}',
			timestamp: '2024-01-01',
			extraField: true,
		};
		const result = rowParseGeometryGeoJSON(row);
		expect(result.timestamp).toBe('2024-01-01');
		expect(result.extraField).toBe(true);
	});

	it('throws for invalid GeoJSON', () => {
		const row = {
			id: 4,
			geometryGeoJSON: 'not-valid-json',
		};
		expect(() => rowParseGeometryGeoJSON(row)).toThrow(
			'Failed to parse geometry GeoJSON: not-valid-json'
		);
	});
});

// ===========================================================================
// rowsParseGeometryGeoJSON
// ===========================================================================

describe('rowsParseGeometryGeoJSON', () => {
	it('parses an array of rows', () => {
		const rows = [
			{ id: 1, geometryGeoJSON: '{"type":"Point","coordinates":[0,0]}' },
			{ id: 2, geometryGeoJSON: '{"type":"Point","coordinates":[1,1]}' },
		];
		const results = rowsParseGeometryGeoJSON(rows);
		expect(results).toHaveLength(2);
		expect(results[0].geometry).toEqual({
			type: 'Point',
			coordinates: [0, 0],
		});
		expect(results[1].geometry).toEqual({
			type: 'Point',
			coordinates: [1, 1],
		});
	});

	it('returns empty array for empty input', () => {
		expect(rowsParseGeometryGeoJSON([])).toEqual([]);
	});

	it('throws for invalid GeoJSON (per-row)', () => {
		const rows = [
			{ id: 1, geometryGeoJSON: '{"type":"Point","coordinates":[0,0]}' },
			{ id: 2, geometryGeoJSON: 'broken' },
		];
		expect(() => rowsParseGeometryGeoJSON(rows)).toThrow(
			'Failed to parse geometry GeoJSON: broken'
		);
	});
});

// ===========================================================================
// rowParseEnvelopeGeoJSON
// ===========================================================================

describe('rowParseEnvelopeGeoJSON', () => {
	it('parses envelopeGeoJSON string into envelope object', () => {
		const row = {
			id: 1,
			envelopeGeoJSON: '{"type":"Polygon","coordinates":[[[0,0],[1,0],[1,1],[0,1],[0,0]]]}',
		};
		const result = rowParseEnvelopeGeoJSON(row);
		expect(result).not.toHaveProperty('envelopeGeoJSON');
		expect(result.envelope).toEqual({
			type: 'Polygon',
			coordinates: [
				[
					[0, 0],
					[1, 0],
					[1, 1],
					[0, 1],
					[0, 0],
				],
			],
		});
	});

	it('preserves other row properties', () => {
		const row = {
			id: 5,
			envelopeGeoJSON: '{"type":"Polygon","coordinates":[[[0,0],[1,1],[0,0]]]}',
			title: 'envelope test',
		};
		const result = rowParseEnvelopeGeoJSON(row);
		expect(result.title).toBe('envelope test');
		expect(result.id).toBe(5);
	});

	it('throws for invalid JSON', () => {
		const row = { id: 6, envelopeGeoJSON: '{invalid}' };
		expect(() => rowParseEnvelopeGeoJSON(row)).toThrow(
			'Failed to parse envelope GeoJSON: {invalid}'
		);
	});
});

// ===========================================================================
// rowsParseEnvelopeGeoJSON
// ===========================================================================

describe('rowsParseEnvelopeGeoJSON', () => {
	it('parses an array of rows with envelopes', () => {
		const rows = [
			{
				id: 1,
				envelopeGeoJSON: '{"type":"Polygon","coordinates":[[[0,0],[1,1],[0,0]]]}',
			},
			{
				id: 2,
				envelopeGeoJSON: '{"type":"Polygon","coordinates":[[[2,2],[3,3],[2,2]]]}',
			},
		];
		const results = rowsParseEnvelopeGeoJSON(rows);
		expect(results).toHaveLength(2);
		expect((results[0] as any).envelope.type).toBe('Polygon');
		expect((results[1] as any).envelope.type).toBe('Polygon');
		expect((results[0] as any).id).toBe(1);
		expect((results[1] as any).id).toBe(2);
	});

	it('returns empty array for empty input', () => {
		expect(rowsParseEnvelopeGeoJSON([])).toEqual([]);
	});
});

// ===========================================================================
// parseReturningIds
// ===========================================================================

describe('parseReturningIds', () => {
	it('extracts id from rows', () => {
		const result = {
			rows: [
				{ id: 1 },
				{ id: 2 },
				{ id: 3 },
			],
			insertId: 0,
			rowsAffected: 3,
		};
		const ids = parseReturningIds(result);
		expect(ids).toEqual([
			{ id: 1 },
			{ id: 2 },
			{ id: 3 },
		]);
	});

	it('handles empty rows', () => {
		const result = { rows: [], insertId: 0, rowsAffected: 0 };
		expect(parseReturningIds(result)).toEqual([]);
	});

	it('handles undefined rows (null coalescing to [])', () => {
		const result: any = { insertId: 0, rowsAffected: 0 };
		expect(parseReturningIds(result)).toEqual([]);
	});

	it('handles non-numeric ids as-is', () => {
		const result = {
			rows: [{ id: 'abc' }, { id: 42 }],
			insertId: 0,
			rowsAffected: 2,
		};
		const ids = parseReturningIds(result);
		expect(ids).toEqual([{ id: 'abc' }, { id: 42 }]);
	});
});

// ===========================================================================
// withDbTransaction — exec accepts drizzle query builders
// ===========================================================================

describe('withDbTransaction exec query shapes', () => {
	const originalOp = dbConnection.op;
	const fakeTx = {
		execute: jest.fn().mockResolvedValue({ rows: [], insertId: 0, rowsAffected: 1 }),
	};
	const fakeOp = {
		transaction: jest.fn(async (cb: (tx: typeof fakeTx) => Promise<unknown>) => cb(fakeTx)),
	};

	beforeAll(() => {
		(dbConnection as any).op = fakeOp;
	});

	afterAll(() => {
		(dbConnection as any).op = originalOp;
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('runs queries exposing toSQL (drizzle query builders)', async () => {
		await withDbTransaction(async (exec) => {
			await exec({ toSQL: () => ({ sql: 'SELECT ?', params: [1] }) });
		});
		expect(fakeOp.transaction).toHaveBeenCalledTimes(1);
		expect(fakeTx.execute).toHaveBeenCalledWith('SELECT ?', [1]);
	});

	it('propagates executor errors to the caller', async () => {
		fakeTx.execute.mockRejectedValueOnce(new Error('boom'));
		await expect(
			withDbTransaction(async (exec) => {
				await exec({ toSQL: () => ({ sql: 'SELECT 1', params: [] }) });
			})
		).rejects.toThrow('boom');
	});
});
