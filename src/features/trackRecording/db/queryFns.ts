/**
 * External dependencies
 */
import { desc, eq } from 'drizzle-orm';
import { QueryClient } from '@tanstack/react-query';

/**
 * Internal dependencies
 */
import { dbConnection } from '../../dbLoader/DBConnection';
import { tracksTable } from './schema/schema';
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
