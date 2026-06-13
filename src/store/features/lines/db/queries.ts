import { fetchLines, FetchLinesParams } from './fetch';

/**
 * Functions to be used by react query:
 * Wrappers for the db fetch functions.
 *
 */
/**
 */

/**
 *
 * Used with:
 *  queryKey: ['linesMeta', selectedIds],
 *  queryKey: ['linesMeta'],
 *  queryKey: ['linesGeom', selectedIds],
 */
export const queryLines = async (params: FetchLinesParams) => {
	return await fetchLines(params);
};
