import { fetchLinesWithTags } from './fetch';

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
 *  queryKey: ['lines', selectedIds],
 */
export const queryLines = async (lineIds?: number[]) => {
	return await fetchLinesWithTags({
		lineIds,
		allLines: true,
	});
};
