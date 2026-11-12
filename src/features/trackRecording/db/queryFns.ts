/**
 * External dependencies
 */
import { asc, desc, eq, inArray } from 'drizzle-orm';
import { QueryClient } from '@tanstack/react-query';
import type { Scalar } from '@op-engineering/op-sqlite';

/**
 * Internal dependencies
 */
import { dbConnection } from '../../dbLoader/DBConnection';
import { dbOpExecute } from '../../dbLoader/utils';
import { trackPointsTable, tracksTable } from './schema/schema';
import { Track } from '../types';
import { PAUSE_GAP_THRESHOLD_MS } from '../utils';
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
 * Only used to seed the trackRecording slice's `lastRecordedLineId`
 * for legacy installs — the drawer reads the Redux field, not this
 * query, so no invalidation helper is needed.
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
 * Invalidate per-line track_points queries (['lineTrackPoints', lineId])
 * — used by the export flow for GPX <time>/GeoJSON coordTimes.
 */
export const invalidateLineTrackPointsQueries = (queryClient: QueryClient, lineId?: number) => {
	return queryClient.invalidateQueries({
		predicate: (query) => {
			if (!Array.isArray(query.queryKey) || query.queryKey[0] !== 'lineTrackPoints') {
				return false;
			}
			if (lineId == null) {
				return true;
			}
			// Key shapes: ['lineTrackPoints', lineId, …] (per line) and
			// ['lineTrackPoints', '3,7,12', 'stats'] (multi-line stats
			// modal, sorted comma-joined ids).
			const part = query.queryKey[1];
			return typeof part === 'string'
				? part.split(',').includes(String(lineId))
				: part === lineId;
		},
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

/**
 * Aggregate stats over a line's track_points (live while recording).
 * `movingDurationMs` sums inter-point timestamp gaps up to the pause
 * threshold (gaps larger than that count as pauses, mirroring
 * computeTrackSummary).  A single aggregate per fix — never the full
 * rows.
 */
export interface TrackPointsStats {
	count: number;
	maxSpeed: number | null;
	startTs: number | null;
	endTs: number | null;
	movingDurationMs: number;
}

export const queryTrackPointsStats = async (lineId: number): Promise<TrackPointsStats | null> => {
	if (!dbConnection?.op) {
		return null;
	}
	const result = await dbOpExecute(
		`SELECT
			COUNT(*) AS n,
			MAX(speed) AS maxSpeed,
			MIN(ts) AS startTs,
			MAX(ts) AS endTs,
			COALESCE(SUM(
				CASE
					WHEN ts - prevTs > 0 AND ts - prevTs <= ? THEN ts - prevTs
					ELSE 0
				END
			), 0) AS movingMs
		FROM (
			SELECT
				timestamp AS ts,
				LAG(timestamp) OVER (ORDER BY point_index) AS prevTs,
				speed
			FROM track_points
			WHERE line_id = ?
		)`,
		[PAUSE_GAP_THRESHOLD_MS, lineId]
	);
	const row = result.rows?.[0] as Record<string, Scalar> | undefined;
	if (!row) {
		return null;
	}
	return {
		count: typeof row.n === 'number' ? row.n : 0,
		maxSpeed: typeof row.maxSpeed === 'number' ? row.maxSpeed : null,
		startTs: typeof row.startTs === 'number' ? row.startTs : null,
		endTs: typeof row.endTs === 'number' ? row.endTs : null,
		movingDurationMs: typeof row.movingMs === 'number' ? row.movingMs : 0,
	};
};

/**
 * Per-line aggregate stats for several lines in ONE query (stats
 * modal): the same aggregation as queryTrackPointsStats, partitioned by
 * line_id.  Lines without track_points rows simply don't appear.
 */
export interface LineTrackPointsStats extends TrackPointsStats {
	lineId: number;
}

export const queryTrackPointsStatsByLineIds = async (
	lineIds: number[]
): Promise<LineTrackPointsStats[]> => {
	if (!dbConnection?.op || !lineIds.length) {
		return [];
	}
	const placeholders = lineIds.map(() => '?').join(', ');
	const result = await dbOpExecute(
		`SELECT
			line_id AS lineId,
			COUNT(*) AS n,
			MAX(speed) AS maxSpeed,
			MIN(ts) AS startTs,
			MAX(ts) AS endTs,
			COALESCE(SUM(
				CASE
					WHEN ts - prevTs > 0 AND ts - prevTs <= ? THEN ts - prevTs
					ELSE 0
				END
			), 0) AS movingMs
		FROM (
			SELECT
				line_id,
				timestamp AS ts,
				LAG(timestamp) OVER (PARTITION BY line_id ORDER BY point_index) AS prevTs,
				speed
			FROM track_points
			WHERE line_id IN (${placeholders})
		)
		GROUP BY line_id`,
		[PAUSE_GAP_THRESHOLD_MS, ...lineIds]
	);
	return (result.rows ?? []).map((row) => {
		const r = row as Record<string, Scalar>;
		return {
			lineId: r.lineId as number,
			count: typeof r.n === 'number' ? r.n : 0,
			maxSpeed: typeof r.maxSpeed === 'number' ? r.maxSpeed : null,
			startTs: typeof r.startTs === 'number' ? r.startTs : null,
			endTs: typeof r.endTs === 'number' ? r.endTs : null,
			movingDurationMs: typeof r.movingMs === 'number' ? r.movingMs : 0,
		};
	});
};

/**
 * Invalidate track-summary queries (['trackSummary', lineId]) — used
 * after a recording stops so the drawer's idle view refetches the
 * freshly written tracks.data summary.
 */
export const invalidateTrackSummaryQueries = (queryClient: QueryClient) => {
	return queryClient.invalidateQueries({
		predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'trackSummary',
	});
};
