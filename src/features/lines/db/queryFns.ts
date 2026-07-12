/**
 * External dependencies
 */
import { WithRequired } from '@tanstack/react-query';

/**
 * Internal dependencies
 */
import { Line, LinePartial, SortState, ColumnFilter, FilterLogic } from '../types';
import { fetchLines, fetchAllTags, fetchTagsWithLineCounts } from './fetch';

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
	return new Promise<null | WithRequired<LinePartial, 'geometry' | 'envelope'>>(
		(resolve, reject) => {
			if (queryKey.length < 2 || 'number' !== typeof queryKey[1]) {
				return resolve(null);
			}
			fetchLines({
				lineIds: [queryKey[1]],
				fieldsInclude: ['geometry', 'envelope'],
				...(queryKey.length > 2 &&
					'number' === typeof queryKey[2] && { simplify: queryKey[2] }),
			})
				.then((lines) => {
					resolve(
						lines.length
							? (lines[0] as WithRequired<LinePartial, 'geometry' | 'envelope'>)
							: null
					);
				})
				.catch((error) => {
					reject(error);
				});
		}
	);
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

/**
 * Invalidate all tagsTable queries (predicate-based for reliability).
 * Use after create/update/delete tag operations.
 */
export const invalidateTagsTable = (queryClient: {
	invalidateQueries: (opts: any) => Promise<any>;
	refetchQueries: (opts: any) => Promise<any>;
}) => {
	const predicate = (query: any) =>
		Array.isArray(query.queryKey) && query.queryKey[0] === 'tagsTable';
	return queryClient
		.invalidateQueries({ predicate })
		.then(() => queryClient.refetchQueries({ predicate }));
};

/**
 * Cancel all in-flight lines queries. Uses a predicate because React Query v5
 * defaults exact:true — a queryKey filter would miss most queries.
 * Use in mutation onMutate to prevent stale fetches from overwriting writes.
 */
export const cancelLinesQueries = (queryClient: { cancelQueries: (opts: any) => Promise<any> }) =>
	queryClient.cancelQueries({
		predicate: (query: any) => Array.isArray(query.queryKey) && query.queryKey[0] === 'lines',
	});

/**
 * Invalidate and refetch all active lines queries, returning a promise
 * that resolves when every matching query has completed.
 * Use after tag-line association changes (add/remove tags on lines).
 *
 * Uses a predicate (not a queryKey) because React Query v5 defaults
 * exact:true on queryKey filters — { queryKey: ['lines'] } would only
 * match the literal key ['lines'], missing ['lines', [id]] and
 * ['lines', { sort, ... }].
 */
export const invalidateLinesQueries = (queryClient: {
	invalidateQueries: (opts: any) => Promise<any>;
	refetchQueries: (opts: any) => Promise<any>;
}) => {
	const predicate = (query: any) =>
		Array.isArray(query.queryKey) && query.queryKey[0] === 'lines';
	return queryClient
		.invalidateQueries({ predicate })
		.then(() => queryClient.refetchQueries({ predicate }));
};

/**
 * Fetch tags with line counts, optional sorting and filtering.
 *
 * Used with:
 *  queryKey: ['tagsTable'],
 *  queryKey: ['tagsTable', { sort, filters, filterLogic }],
 */
export const queryTagsWithLineCounts = ({
	queryKey,
}: {
	queryKey:
		| [string]
		| [
				string,
				{ sort?: SortState | null; filters?: ColumnFilter[]; filterLogic?: FilterLogic },
		  ];
}) => {
	const opts = queryKey.length > 1 ? queryKey[1] : undefined;
	return fetchTagsWithLineCounts(opts);
};

/**
 * Batch-fetch geometry for multiple line IDs at a given simplification
 * tolerance, optionally filtered to a coarse geographic bounding box.
 *
 * Replaces N individual ['lineGeom', lineId, simplify] queries with a single
 * DB call.  When `bbox` is provided, SpatiaLite filters rows via
 * `MbrIntersects` (using the R-tree spatial index) before `Simplify()` runs.
 *
 * Used with:
 *  queryKey: ['lineGeomsBatch', selectedIds, simplify, bbox],
 */
export const queryLineGeomsBatch = ({
	queryKey,
}: {
	queryKey: [
		string,
		number[],
		number,
		(
			| [
					number,
					number,
					number,
					number,
			  ]
			| null
		),
	];
}) => {
	const [
		_prefix,
		lineIds,
		simplify,
		bbox,
	] = queryKey;

	if (!lineIds.length) {
		return Promise.resolve([] as WithRequired<LinePartial, 'geometry'>[]);
	}

	return fetchLines({
		lineIds,
		fieldsInclude: ['geometry'],
		simplify,
		...(bbox && { bbox }),
	}) as Promise<WithRequired<LinePartial, 'geometry'>[]>;
};
