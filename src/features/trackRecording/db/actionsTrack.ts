/**
 * External dependencies
 */
import { sql } from 'drizzle-orm';

/**
 * Internal dependencies
 */
import { dbConnection } from '../../dbLoader/DBConnection';
import { tracksTable } from './schema/schema';
import { withDbErrorHandling } from '../../dbLoader/utils';
import { toTrackCoord } from '../utils';

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
 *
 * Executed via drizzle's `run()` — the official raw-SQL path.  Raw
 * `sql`` ` templates must NOT go through `withDbTransaction` (since
 * drizzle 0.41 they expose `toQuery(config)`, not `toSQL()`, and the
 * transaction helper only accepts query builders).  A single UPDATE is
 * atomic on its own, so no transaction wrapper is needed.
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
	// The DB schema enforces POINTZ / LINESTRINGZ (3D).  Always write 3D
	// coordinates — appending a 2D point to a 3D LineString (or vice
	// versa) makes SpatiaLite's ST_AddPoint throw on every append, which
	// silently freezes the recording at the first two points.  Missing
	// altitudes are written as 0 (placeholder until DEM/GNSS fills in).
	const coordinates = toTrackCoord(lng, lat, z);

	const geoJson = JSON.stringify({
		type: 'Point',
		coordinates,
		crs: {
			type: 'name',
			properties: { name: 'EPSG:4326' },
		},
	});

	// GeomFromGeoJSON takes a single argument in this SpatiaLite build —
	// the SRID comes from the embedded `crs` member (EPSG:4326 above).
	// The two-argument form throws "wrong number of arguments".
	await dbConnection.drizzle.run(sql`
		UPDATE lines
		SET
			geometry = ST_AddPoint (
				geometry,
				GeomFromGeoJSON (${geoJson}),
				-1
			),
			modified_at = (current_timestamp)
		WHERE
			id = ${lineId}
	`);
};
