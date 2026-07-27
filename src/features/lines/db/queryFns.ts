/**
 * External dependencies
 */
import { QueryClient, WithRequired } from '@tanstack/react-query';
import type { Query } from '@tanstack/react-query';

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

/** Set to a positive number to return that many fake lines instead of
 *  hitting the database.  0 = disabled (real data). */
const MOCK_LINE_COUNT = 0;

/** Same as MOCK_LINE_COUNT, but for the tags table. */
const MOCK_TAG_COUNT = 0;

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
	// ── Mock data for scroll-performance testing ──────────────────────────
	if (__DEV__ && MOCK_LINE_COUNT) {
		return Promise.resolve(
			Array.from({ length: MOCK_LINE_COUNT }, (_, i) => {
				const id = i + 1;
				const lat = 40 + (i % 100) * 0.01;
				const lng = -3 + Math.floor(i / 100) * 0.01;
				const envPoly: any = {
					type: 'Polygon',
					coordinates: [
						[
							[lng, lat],
							[lng + 0.005, lat],
							[lng + 0.005, lat + 0.005],
							[lng, lat + 0.005],
							[lng, lat],
						],
					],
				};
				return {
					id,
					title: `Line ${id}`,
					envelope: envPoly,
					created_at: new Date(Date.UTC(2026, 0, 1) + i * 36_000_000).toISOString(),
					modified_at: new Date(Date.UTC(2026, 0, 1) + i * 36_000_000).toISOString(),
					custom_date:
						i % 3 === 0
							? null
							: new Date(Date.UTC(2025, i % 12, (i % 28) + 1)).toISOString(),
					tags: [],
					data: null,
					stats: {
						length: 1000 + i * 500,
						uphill: i % 7 === 0 ? undefined : i * 10,
						downhill: i % 5 === 0 ? undefined : i * 8,
						minZ: i % 11 === 0 ? undefined : 100 + i,
						maxZ: i % 13 === 0 ? undefined : 500 + i * 2,
					},
				};
			})
		) as Promise<Omit<Line, 'geometry'>[]>;
	}

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
export const invalidateTagsTable = (queryClient: QueryClient) => {
	const predicate = (query: Query) =>
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
export const cancelLinesQueries = (queryClient: QueryClient) =>
	queryClient.cancelQueries({
		predicate: (query: Query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'lines',
	});

/**
 * Cancel all in-flight line geometry queries (both singular `lineGeom`
 * and batch `lineGeomsBatch`).  Use in mutation onMutate to prevent
 * stale geometry fetches from overwriting writes.
 */
export const cancelLineGeomQueries = (queryClient: QueryClient) =>
	queryClient.cancelQueries({
		predicate: (query: Query) =>
			Array.isArray(query.queryKey) &&
			(query.queryKey[0] === 'lineGeom' || query.queryKey[0] === 'lineGeomsBatch'),
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
export const invalidateLinesQueries = (queryClient: QueryClient) => {
	const predicate = (query: Query) =>
		Array.isArray(query.queryKey) && query.queryKey[0] === 'lines';
	return queryClient
		.invalidateQueries({ predicate })
		.then(() => queryClient.refetchQueries({ predicate }));
};

/**
 * Invalidate all line geometry queries (both singular `lineGeom` and
 * batch `lineGeomsBatch`).  Use after any mutation that changes a line's
 * geometry so that map rendering and export consumers pick up the new data.
 *
 * Uses a predicate because React Query v5 defaults exact:true on queryKey
 * filters — a literal key wouldn't match the dynamic keys that carry
 * line IDs, simplify tolerance, bbox, or consumer-specific suffixes.
 */
export const invalidateLineGeomQueries = (queryClient: QueryClient) => {
	const predicate = (query: Query) =>
		Array.isArray(query.queryKey) &&
		(query.queryKey[0] === 'lineGeom' || query.queryKey[0] === 'lineGeomsBatch');
	return queryClient.invalidateQueries({ predicate });
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
	// ── Mock data for scroll-performance testing ──────────────────────────
	if (__DEV__ && MOCK_TAG_COUNT) {
		const labels = [
			'highway',
			'gravel',
			'singletrack',
			'technical',
			'scenic',
			'steep',
			'flowy',
			'rocky',
			'paved',
			'dirt',
		];
		return Promise.resolve(
			Array.from({ length: MOCK_TAG_COUNT }, (_, i) => ({
				id: i + 1,
				label: labels[i % labels.length],
				notes:
					i % 4 === 0
						? Math.random() > 0.5
							? `Capitalism kills dolphins`
							: `Abolish capitalism`
						: null,
				timestamp: new Date(Date.UTC(2026, 0, 1) + i * 72_000_000).toISOString(),
				data: null,
				line_count: 10 + (i % 50),
			}))
		);
	}

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
