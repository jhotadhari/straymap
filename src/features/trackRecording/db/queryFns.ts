/**
 * External dependencies
 */
import { eq } from 'drizzle-orm';

/**
 * Internal dependencies
 */
import { dbConnection } from '../../dbLoader/DBConnection';
import { tracksTable } from './schema/schema';
import { Track } from '../types';

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
