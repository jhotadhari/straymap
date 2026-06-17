import { WithRequired } from '@tanstack/react-query';
import { Line, LinePartial } from '../types';
import { fetchLines } from './fetch';

/**
 * Functions to be used by react query client as queryFn:
 *	- Wrappers for the db fetch functions.
 *	- get their args from queryKey,
 */
/**
 */

/**
 *
 * Used with:
 *  queryKey: ['lines'],
 *  queryKey: ['lines', selectedIds],
 * 	queryKey: ['lines', checkedIds],
 */
export const queryLinesWithoutGeom = ({ queryKey }: { queryKey: (string | number[])[] }) => {
	if (queryKey.length > 1 && !queryKey[1].length) {
		return Promise.resolve([] as Omit<Line, 'geometry'>[]);
	}
	return fetchLines({
		...(queryKey.length > 1 && { lineIds: queryKey[1] as number[] }),
		fieldsExclude: ['geometry'],
	}) as Promise<Omit<Line, 'geometry'>[]>;
};

/**
 *
 * Used with:
 *  queryKey: ['lineGeom', lineId],
 */
export const queryLineGeom = ({ queryKey }: { queryKey: (string | number)[] }) => {
	return new Promise<null | WithRequired<LinePartial, 'geometry'>>((resolve, reject) => {
		if (queryKey.length < 2) {
			return resolve(null);
		}
		fetchLines({
			lineIds: [queryKey[1]] as number[],
			fieldsInclude: ['geometry'],
		})
			.then((lines) => {
				resolve(lines.length ? (lines[0] as WithRequired<LinePartial, 'geometry'>) : null);
			})
			.catch((error) => {
				reject(error);
			});
	});
};
