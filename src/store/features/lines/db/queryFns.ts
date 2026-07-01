/**
 * External dependencies
 */
import { WithRequired } from '@tanstack/react-query';

/**
 * Internal dependencies
 */
<<<<<<< Updated upstream
import { Line, LinePartial } from '../types';
=======
import { ColumnFilter, FilterLogic, Line, LinePartial, SortState } from '../types';
>>>>>>> Stashed changes
import { fetchLines } from './fetch';

interface QueryOptions {
	sort?: SortState | null;
	filters?: ColumnFilter[];
	filterLogic?: FilterLogic;
}

/**
 * Functions to be used by react query client as queryFn:
 *	- Wrappers for the db fetch functions.
 *	- get their args from queryKey,
 */
/**
 *
 * Used with:
 *  queryKey: ['lines'],
 *  queryKey: ['lines', lineIds],
 * 	queryKey: ['lines', checkedIds],
 *  queryKey: ['lines', { sort, filters, filterLogic }],
 */
export const queryLinesWithoutGeom = ({
	queryKey,
}: {
	queryKey: (string | number[] | QueryOptions)[];
}) => {
	const secondArg = queryKey[1];

	// If second arg is an array of numbers, treat as lineIds (backward-compatible).
	if (Array.isArray(secondArg)) {
		if (!secondArg.length || 'number' !== typeof secondArg[0]) {
			return Promise.resolve([] as Omit<Line, 'geometry'>[]);
		}
		return fetchLines({
			lineIds: secondArg as number[],
			fieldsExclude: ['geometry'],
		}) as Promise<Omit<Line, 'geometry'>[]>;
	}

	// If second arg is an object, treat as query options.
	if (secondArg && 'object' === typeof secondArg && !Array.isArray(secondArg)) {
		const opts = secondArg as QueryOptions;
		return fetchLines({
			fieldsExclude: ['geometry'],
			sort: opts.sort,
			filters: opts.filters,
			filterLogic: opts.filterLogic,
		}) as Promise<Omit<Line, 'geometry'>[]>;
	}

	// Default: fetch all lines (no options, no lineIds).
	return fetchLines({
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
		if (queryKey.length < 2 || 'number' !== typeof queryKey[1]) {
			return resolve(null);
		}
		fetchLines({
			lineIds: [queryKey[1]],
			fieldsInclude: ['geometry'],
			...(queryKey.length > 2 &&
				'number' === typeof queryKey[2] && { simplify: queryKey[2] }),
		})
			.then((lines) => {
				resolve(lines.length ? (lines[0] as WithRequired<LinePartial, 'geometry'>) : null);
			})
			.catch((error) => {
				reject(error);
			});
	});
};
