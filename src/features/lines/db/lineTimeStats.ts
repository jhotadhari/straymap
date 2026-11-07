/**
 * External dependencies
 */
import { Scalar } from '@op-engineering/op-sqlite';

/**
 * Internal dependencies
 */
import { dbConnection } from '../../dbLoader/DBConnection';
import { dbOpExecute } from '../../dbLoader/utils';
import { PAUSE_GAP_THRESHOLD_MS } from '../../trackRecording/utils';
import type { LineTrackPointsStats } from '../../trackRecording/db/queryFns';

/**
 * Per-line time stats from imported line_points rows — the same shape as
 * trackRecording's LineTrackPointsStats so the stats modal can reuse its
 * aggregation and row rendering unchanged.
 */
export type LinePointsStats = LineTrackPointsStats;

/**
 * Aggregate time stats over line_points for several lines in ONE query
 * (stats modal): moving duration sums inter-point timestamp gaps up to
 * the pause threshold (gaps larger than that count as pauses, mirroring
 * trackRecording's queryTrackPointsStatsByLineIds).  Lines without
 * line_points rows simply don't appear.
 */
export const queryLinePointsStatsByLineIds = async (
	lineIds: number[]
): Promise<LinePointsStats[]> => {
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
			FROM line_points
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
