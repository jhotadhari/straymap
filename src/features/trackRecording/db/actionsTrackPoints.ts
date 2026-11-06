/**
 * Internal dependencies
 */
import { dbConnection } from '../../dbLoader/DBConnection';
import { TrackPointInput } from '../types';
import { trackPointsTable } from './schema/schema';

/**
 * Insert a single track-point metadata row.  Deliberately NOT wrapped
 * with withDbErrorHandling — like appendPointToLine, this runs on the
 * GNSS filter hot path and the caller handles errors itself (a lost
 * metadata row is a tolerated tail gap; geometry remains the anchor).
 */
export const insertTrackPoint = async (input: TrackPointInput): Promise<void> => {
	if (!dbConnection?.drizzle) {
		return;
	}
	await dbConnection.drizzle.insert(trackPointsTable).values(input);
};

/**
 * Insert several track-point metadata rows in one statement (used when
 * the track line is created lazily from the first two buffered fixes).
 * Same error-handling contract as insertTrackPoint.
 */
export const insertTrackPoints = async (inputs: TrackPointInput[]): Promise<void> => {
	if (!dbConnection?.drizzle) {
		return;
	}
	if (!inputs.length) {
		return;
	}
	await dbConnection.drizzle.insert(trackPointsTable).values(inputs);
};
