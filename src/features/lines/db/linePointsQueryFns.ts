/**
 * External dependencies
 */
import { asc, eq, inArray } from 'drizzle-orm';

/**
 * Internal dependencies
 */
import { dbConnection } from '../../dbLoader/DBConnection';
import { linePointsTable } from './schema/schema';

/**
 * Per-point metadata rows for imported lines (line_points), ordered by
 * point_index — the raw-row counterpart to trackRecording's
 * queryTrackPointsByLineId(s), so the exporter can emit GPX `<time>` /
 * GeoJSON `coordTimes` for imported lines too.  Rows are mapped to the
 * same shape track_points rows expose (`gnss_altitude` always null —
 * imported rows never carry it), so both sources feed
 * alignPointsToCoords unchanged.
 */
export interface LinePointExportMeta {
	line_id: number;
	point_index: number;
	timestamp: number;
	speed: number | null;
	gnss_altitude: null;
}

const toExportMeta = (
	rows: {
		line_id: number;
		point_index: number;
		timestamp: number;
		speed: number | null;
	}[]
): LinePointExportMeta[] =>
	rows.map((r) => ({
		line_id: r.line_id,
		point_index: r.point_index,
		timestamp: r.timestamp,
		speed: r.speed,
		gnss_altitude: null,
	}));

/**
 * All line_points rows of one line, ordered by point_index (0-based,
 * aligned to lines.geometry coordinates).  Partial select skips the
 * `data` JSON column.
 */
export const queryLinePointsByLineId = async (lineId: number): Promise<LinePointExportMeta[]> => {
	if (!dbConnection?.drizzle) {
		return [];
	}
	const rows = await dbConnection.drizzle
		.select({
			line_id: linePointsTable.line_id,
			point_index: linePointsTable.point_index,
			timestamp: linePointsTable.timestamp,
			speed: linePointsTable.speed,
		})
		.from(linePointsTable)
		.where(eq(linePointsTable.line_id, lineId))
		.orderBy(asc(linePointsTable.point_index));
	return toExportMeta(rows);
};

/**
 * line_points rows for several lines in one query (bulk export),
 * ordered by line_id then point_index so callers can bucket by line_id.
 */
export const queryLinePointsByLineIds = async (
	lineIds: number[]
): Promise<LinePointExportMeta[]> => {
	if (!dbConnection?.drizzle || !lineIds.length) {
		return [];
	}
	const rows = await dbConnection.drizzle
		.select({
			line_id: linePointsTable.line_id,
			point_index: linePointsTable.point_index,
			timestamp: linePointsTable.timestamp,
			speed: linePointsTable.speed,
		})
		.from(linePointsTable)
		.where(inArray(linePointsTable.line_id, lineIds))
		.orderBy(asc(linePointsTable.line_id), asc(linePointsTable.point_index));
	return toExportMeta(rows);
};
