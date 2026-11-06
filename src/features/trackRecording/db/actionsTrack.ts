/**
 * External dependencies
 */
import { eq, sql } from 'drizzle-orm';

/**
 * Internal dependencies
 */
import { dbConnection } from '../../dbLoader/DBConnection';
import { withDbErrorHandling } from '../../dbLoader/utils';
import { fetchLines } from '../../lines/db/fetch';
import { computeTrackSummary } from '../utils';
import { queryLastTrackPoint, queryLinePointCount, queryTrackPointsByLineId } from './queryFns';
import { tracksTable } from './schema/schema';
import { TrackSummary } from '../types';
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

/**
 * Compute the track's summary from its geometry + track_points and write
 * it to the track row's `data` JSON.  The summary is a cache — the raw
 * data always wins (see getTrackSummary).
 */
export const finalizeTrackSummary = withDbErrorHandling(
	'trackRecording/actionsTrack.finalizeTrackSummary',
	async (trackId: number, lineId: number): Promise<TrackSummary | null> => {
		if (!dbConnection?.drizzle) {
			return null;
		}
		const lines = await fetchLines({ lineIds: [lineId], fieldsInclude: ['geometry'] });
		const coords = (lines[0]?.geometry?.coordinates ?? []) as number[][];
		const points = await queryTrackPointsByLineId(lineId);
		const summary = computeTrackSummary(coords, points);
		await dbConnection.drizzle
			.update(tracksTable)
			.set({ data: summary })
			.where(eq(tracksTable.id, trackId));
		return summary;
	}
);

/**
 * Return the track's summary, recomputing and re-caching it when the
 * cached value is missing or stale (point count changed, or the last
 * point's timestamp advanced).  Cheap freshness check on read, so a
 * crash mid-recording costs one recomputation on the next access —
 * nothing is ever lost.
 */
export const getTrackSummary = withDbErrorHandling(
	'trackRecording/actionsTrack.getTrackSummary',
	async (trackId: number, lineId: number): Promise<TrackSummary | null> => {
		if (!dbConnection?.drizzle) {
			return null;
		}
		const rows = await dbConnection.drizzle
			.select({ data: tracksTable.data })
			.from(tracksTable)
			.where(eq(tracksTable.id, trackId))
			.limit(1);
		const cached = rows[0]?.data as Partial<TrackSummary> | null | undefined;

		const pointCount = await queryLinePointCount(lineId);
		const lastPoint = await queryLastTrackPoint(lineId);
		const lastTimestamp = (lastPoint?.timestamp as number | null) ?? null;

		const fresh =
			!!cached &&
			cached.pointCount === pointCount &&
			(pointCount === 0 || cached.endTime === lastTimestamp);

		return fresh ? (cached as TrackSummary) : finalizeTrackSummary(trackId, lineId);
	}
);
