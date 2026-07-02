/**
 * External dependencies
 */
import { WithRequired } from '@tanstack/react-query';

/**
 * Internal dependencies
 */
import { Line, LinePartial, SortState, ColumnFilter, FilterLogic } from '../types';
import { fetchLines, fetchAllTags } from './fetch';

interface LinesQueryOptions {
	lineIds?: number[];
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
 *  queryKey: ['lines', selectedIds],
 * 	queryKey: ['lines', checkedIds],
 *  queryKey: ['lines', { sort, filters, filterLogic }],
 */
export const queryLinesWithoutGeom = ({
	queryKey,
}: {
	queryKey: [string] | [string, number[]] | [string, LinesQueryOptions];
}) => {
	const opts: LinesQueryOptions | undefined =
		queryKey.length > 1 ? (queryKey[1] as LinesQueryOptions) : undefined;

	// Old-style: second element is a number array (lineIds)
	if (Array.isArray(opts)) {
		if (!opts.length) {
			return Promise.resolve([] as Omit<Line, 'geometry'>[]);
		}
		return fetchLines({
			lineIds: opts as number[],
			fieldsExclude: ['geometry'],
		}) as Promise<Omit<Line, 'geometry'>[]>;
	}

	// New-style: second element is LinesQueryOptions
	return fetchLines({
		...(opts?.lineIds && { lineIds: opts.lineIds }),
		...(opts?.sort && { sort: opts.sort }),
		...(opts?.filters?.length && { filters: opts.filters }),
		...(opts?.filterLogic && { filterLogic: opts.filterLogic }),
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

/**
 * Fetch all tags from the tags table.
 *
 * Used with:
 *  queryKey: ['tags'],
 */
export const queryAllTags = () => {
	return fetchAllTags();
};
