/**
 * External dependencies
 */
import { asc, desc, eq, inArray } from 'drizzle-orm';
import { QueryClient } from '@tanstack/react-query';

/**
 * Internal dependencies
 */
import { dbConnection } from '../../dbLoader/DBConnection';
import { dbOpExecute } from '../../dbLoader/utils';
import { trackPointsTable, tracksTable } from './schema/schema';
import { Track } from '../types';
import { linesTable, tagsTable, tagsToLinesTable } from '../../lines/db/schema/schema';

export const queryTrack = async ({ queryKey }: { queryKey: [string, number] }) => {
	const [, trackId] = queryKey;
	if (!dbConnection?.drizzle) {
		return null;
	}
	const rows = await dbConnection.drizzle
		.select()
		.from(tracksTable)
		.where(eq(tracksTable.id, trackId))
		.limit(1);
	return (rows[0] as Track) || null;
};

export const queryTracks = async () => {
	if (!dbConnection?.drizzle) {
		return [];
	}
	return (await dbConnection.drizzle.select().from(tracksTable)) as Track[];
};

/**
 * Does a line with this id exist?  Used before resuming a restored
 * recording — a deleted line must not silently swallow appends.
 */
export const queryLineExists = async (lineId: number): Promise<boolean> => {
	if (!dbConnection?.drizzle) {
		return false;
	}
	const rows = await dbConnection.drizzle
		.select({ id: linesTable.id })
		.from(linesTable)
		.where(eq(linesTable.id, lineId))
		.limit(1);
	return rows.length > 0;
};

/**
 * Latest track row for a line (id DESC = most recently created session).
 */
export const queryTrackByLineId = async (lineId: number) => {
	if (!dbConnection?.drizzle) {
		return null;
	}
	const rows = await dbConnection.drizzle
		.select()
		.from(tracksTable)
		.where(eq(tracksTable.line_id, lineId))
		.orderBy(desc(tracksTable.id))
		.limit(1);
	return (rows[0] as Track) || null;
};

/**
 * Most recently created line carrying the system 'recorded' tag.
 * `created_at` ranks recordings correctly (recording start time).
 */
export const queryLastRecordedLine = async () => {
	if (!dbConnection?.drizzle) {
		return null;
	}
	const rows = await dbConnection.drizzle
		.select({ id: linesTable.id })
		.from(linesTable)
		.innerJoin(tagsToLinesTable, eq(tagsToLinesTable.line_id, linesTable.id))
		.innerJoin(tagsTable, eq(tagsTable.id, tagsToLinesTable.tag_id))
		.where(eq(tagsTable.label, 'recorded'))
		.orderBy(desc(linesTable.created_at))
		.limit(1);
	return rows[0]?.id ?? null;
};

/**
 * Invalidate the last-recorded-line query (['lastRecordedLine']).
 */
export const invalidateLastRecordedLineQueries = (queryClient: QueryClient) => {
	return queryClient.invalidateQueries({
		predicate: (query) =>
			Array.isArray(query.queryKey) && query.queryKey[0] === 'lastRecordedLine',
	});
};

/**
 * Invalidate per-line track_points queries (['lineTrackPoints', lineId])
 * — used by the export flow for GPX <time>/GeoJSON coordTimes.
 */
export const invalidateLineTrackPointsQueries = (queryClient: QueryClient) => {
	return queryClient.invalidateQueries({
		predicate: (query) =>
			Array.isArray(query.queryKey) && query.queryKey[0] === 'lineTrackPoints',
	});
};

/**
 * Number of coordinates in the line's geometry (ST_NPoints) — the anchor
 * for the next `point_index` when a recording session (re)starts on an
 * existing line.  Geometry can be ahead of track_points (crash between
 * the two writes), never behind: metadata is written only after the
 * geometry append succeeds.
 */
export const queryLinePointCount = async (lineId: number): Promise<number | null> => {
	if (!dbConnection?.op) {
		return null;
	}
	const result = await dbOpExecute('SELECT ST_NPoints(geometry) AS n FROM lines WHERE id = ?', [
		lineId,
	]);
	const row = result.rows?.[0] as Record<string, unknown> | undefined;
	return typeof row?.n === 'number' ? row.n : null;
};

/**
 * Latest metadata row of a line (highest point_index) — e.g. for
 * summary freshness checks or speed-baseline seeding on continue.
 */
export const queryLastTrackPoint = async (lineId: number) => {
	if (!dbConnection?.drizzle) {
		return null;
	}
	const rows = await dbConnection.drizzle
		.select()
		.from(trackPointsTable)
		.where(eq(trackPointsTable.line_id, lineId))
		.orderBy(desc(trackPointsTable.point_index))
		.limit(1);
	return rows[0] ?? null;
};

/**
 * All metadata rows of a line, ordered by point_index (0-based, aligned
 * to lines.geometry coordinates).
 */
export const queryTrackPointsByLineId = async (lineId: number) => {
	if (!dbConnection?.drizzle) {
		return [];
	}
	return dbConnection.drizzle
		.select()
		.from(trackPointsTable)
		.where(eq(trackPointsTable.line_id, lineId))
		.orderBy(asc(trackPointsTable.point_index));
};

/**
 * Metadata rows for several lines in one query (bulk export).
 */
export const queryTrackPointsByLineIds = async (lineIds: number[]) => {
	if (!dbConnection?.drizzle || !lineIds.length) {
		return [];
	}
	return dbConnection.drizzle
		.select()
		.from(trackPointsTable)
		.where(inArray(trackPointsTable.line_id, lineIds))
		.orderBy(asc(trackPointsTable.line_id), asc(trackPointsTable.point_index));
};
