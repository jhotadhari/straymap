/**
 * External dependencies
 */
import { inArray } from 'drizzle-orm';

/**
 * Internal dependencies
 */
import { dbConnection } from '../../dbLoader/DBConnection';
import { linePointsTable } from './schema/schema';
import { withDbErrorHandling, withDbTransaction } from '../../dbLoader/utils';

export type LinePointInput = {
	line_id: number;
	point_index: number;
	timestamp: number;
	speed: number | null;
	data?: any;
};

const toInsertValues = (rows: LinePointInput[]) =>
	rows.map((r) => ({
		line_id: r.line_id,
		point_index: r.point_index,
		timestamp: r.timestamp,
		speed: r.speed ?? undefined,
		data: r.data ?? null,
	}));

/**
 * Bulk-insert line_points rows (imported per-point timestamps/speeds).
 */
export const createLinePoints = withDbErrorHandling(
	'lines/actionsLinePoints.createLinePoints',
	async (rows: LinePointInput[]) => {
		if (!dbConnection?.drizzle || !rows.length) {
			return;
		}
		await dbConnection.drizzle.insert(linePointsTable).values(toInsertValues(rows));
	}
);

/**
 * Atomically replace the line_points rows of the given lines (delete +
 * bulk insert in one transaction).  Used by overwrite imports, where
 * the geometry changes and stale point metadata must not survive.
 */
export const replaceLinePoints = withDbErrorHandling(
	'lines/actionsLinePoints.replaceLinePoints',
	async (lineIds: number[], rows: LinePointInput[]) => {
		if (!dbConnection?.drizzle || (!lineIds.length && !rows.length)) {
			return;
		}
		await withDbTransaction(async (exec) => {
			if (lineIds.length) {
				await exec(
					dbConnection
						.drizzle!.delete(linePointsTable)
						.where(inArray(linePointsTable.line_id, lineIds))
				);
			}
			if (rows.length) {
				await exec(
					dbConnection.drizzle!.insert(linePointsTable).values(toInsertValues(rows))
				);
			}
		});
	}
);

/**
 * Delete line_points rows for the given line ids.  The schema FK has
 * ON DELETE cascade, but PRAGMA foreign_keys may not be ON at runtime —
 * keep this explicit cleanup as a safety net (mirrors deleteTag).
 */
export const deleteLinePointsByLineIds = withDbErrorHandling(
	'lines/actionsLinePoints.deleteLinePointsByLineIds',
	async (lineIds: number[]) => {
		if (!dbConnection?.drizzle || !lineIds.length) {
			return;
		}
		await dbConnection
			.drizzle!.delete(linePointsTable)
			.where(inArray(linePointsTable.line_id, lineIds));
	}
);
