/**
 * External dependencies
 */
import { sql } from 'drizzle-orm';

/**
 * Internal dependencies
 */
import { dbConnection } from '../../dbLoader/DBConnection';
import { tracksTable } from './schema/schema';
import { withDbErrorHandling, withDbTransaction } from '../../dbLoader/utils';

/**
 * Create a track record (non-spatial).
 */
export const createTrack = withDbErrorHandling(
	'trackRecording/actionsTrack.createTrack',
	async (params: { line_id: number; title?: string | null; settings?: any; data?: any }) => {
		if (!dbConnection?.drizzle) {
			return;
		}
		const inserted = await dbConnection.drizzle
			.insert(tracksTable)
			.values({
				line_id: params.line_id,
				title: params.title ?? null,
				settings: params.settings ?? {},
				data: params.data ?? {},
			})
			.returning({ id: tracksTable.id });
		return inserted?.[0];
	}
);

/**
 * Append a point to the recording line geometry using SpatiaLite's ST_AddPoint.
 * Runs inside a transaction for crash-safety — the point is committed immediately.
 *
 * NOTE: Not wrapped with withDbErrorHandling because the GNSS filter hot-path
 * caller handles errors itself.  Callers that don't catch should wrap.
 */
export const appendPointToLine = async (
	lineId: number,
	coord: [
		number,
		number,
		number?,
	]
): Promise<void> => {
	if (!dbConnection?.drizzle) {
		return;
	}

	const [
		lng,
		lat,
		z,
	] = coord;
	// Only include z when actually present; MapEventResponse.center only
	// carries [lng, lat] (altitude is intentionally omitted per CLAUDE.md).
	const coordinates: number[] =
		z !== undefined
			? [
					lng,
					lat,
					z,
				]
			: [lng, lat];

	const geoJson = JSON.stringify({
		type: 'Point',
		coordinates,
		crs: {
			type: 'name',
			properties: { name: 'EPSG:4326' },
		},
	});

	await withDbTransaction(async (exec) => {
		const query = sql`
			UPDATE lines
			SET
				geometry = ST_AddPoint (
					geometry,
					GeomFromGeoJSON (${geoJson}, 4326),
					-1
				)
			WHERE
				id = ${lineId}
		`;
		await exec(query as unknown as { toSQL: () => { sql: string; params: unknown[] } });
	});
};
