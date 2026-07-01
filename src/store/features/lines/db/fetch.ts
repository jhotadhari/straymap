/**
 * External dependencies
 */
import { LineString, Polygon } from 'geojson';
import { sql, eq, and, inArray, desc } from 'drizzle-orm';
import { difference, intersection, mapValues, omit, pick } from 'lodash-es';
import { WithRequired } from '@tanstack/react-query';

/**
 * Internal dependencies
 */
import { dbConnection } from '../../dbLoader/DBConnection';
import { linesTable, tagsTable, tagsToLinesTable } from './schema/schema';
import { rowsParseEnvelopeGeoJSON, rowsParseGeometryGeoJSON } from '../../dbLoader/utils';
import { ArrayElement } from '../../../../types';
import {
	ColumnFilter,
	FilterLogic,
	Line,
	LinePartial,
	SortState,
	StringColumnFilter,
	STATS_FIELDS,
	Tag,
} from '../types';
import { STATS_SQL, buildOrderByClause, buildWhereClause } from './filterSortHelpers';

/**
 * Separates regex string filters from other filters.  Regex filters are
 * applied in JavaScript after the query because SQLite's REGEXP operator
 * requires a user-defined regexp() function that may not be available.
 */
const extractRegexFilters = (
	filters?: ColumnFilter[]
): {
	sqlFilters: ColumnFilter[];
	regexFilters: StringColumnFilter[];
} => {
	if (!filters?.length) {
		return { sqlFilters: filters ?? [], regexFilters: [] };
	}
	const regexFilters: StringColumnFilter[] = [];
	const sqlFilters: ColumnFilter[] = [];
	for (const f of filters) {
		if (
			f.type === 'string' &&
			f.operator === 'regex' &&
			!dbConnection.regexpAvailable
		) {
			regexFilters.push(f);
		} else {
			sqlFilters.push(f);
		}
	}
	return { sqlFilters, regexFilters };
};

const applyRegexFilters = <T extends { title?: string | null }>(
	rows: T[],
	regexFilters: StringColumnFilter[]
): T[] => {
	if (!regexFilters.length) {
		return rows;
	}
	// Pre-compile patterns once — avoids per-row RegExp construction
	// (catastrophic backtracking on user-supplied patterns is still
	// possible, but the UI validates before saving to Redux state).
	// Also note: SpatiaLite's REGEXP uses POSIX ERE, which differs
	// from ECMAScript regex (no \b, \d, \w, lookaheads). Filters
	// saved when regexpAvailable==true may produce different results
	// if applied on a device where regexpAvailable==false.
	const compiled: { pattern: RegExp }[] = [];
	for (const f of regexFilters) {
		try {
			compiled.push({ pattern: new RegExp(f.value) });
		} catch {
			// Invalid regex syntax — skip this filter (no rows match)
			return [];
		}
	}
	return rows.filter((row) => {
		const title = row.title ?? '';
		return compiled.every(({ pattern }) => pattern.test(title));
	});
};

/**
 * Functions to fetch/retrieve data from database.
 * They are actually db selectors or drizzle queries. But to avoid naming collisions, let's call/prefix them "fetch".
 *
 */
/**
 */

interface FetchLinesWithoutTagsParams {
	lineIds?: number[];
	limit?: number;
	fieldsInclude?: (keyof Omit<Line, 'id' | 'tags'>)[];
	fieldsExclude?: (keyof Omit<Line, 'id'>)[];
	simplify?: number;
	sort?: SortState | null;
	filters?: ColumnFilter[];
	filterLogic?: FilterLogic;
}

interface FetchLinesWithTagsParams {
	lineIds?: number[];
	limit?: number;
	allLines?: boolean; // defaults to true
	tagId?: number;
	allTags?: boolean;
	fieldsInclude?: (keyof Omit<Line, 'id'>)[];
	fieldsExclude?: (keyof Omit<Line, 'id'>)[];
	simplify?: number;
	sort?: SortState | null;
	filters?: ColumnFilter[];
	filterLogic?: FilterLogic;
}

export interface FetchLinesParams extends FetchLinesWithTagsParams {}

const statsFields = [...STATS_FIELDS] as string[];

interface LineColumnsOptions {
	simplify?: number;
}

const parseRows = (
	aggregated: (Partial<
		Omit<Line, 'geometry' | 'envelope'> & {
			geometryGeoJSON?: string;
			envelopeGeoJSON?: string;
		}
	> & {
		id: number;
	})[],
	fields: (keyof Omit<Line, 'id'>)[]
) => {
	if (fields.includes('geometry')) {
		const aggregated_ = aggregated as WithRequired<
			ArrayElement<typeof aggregated>,
			'geometryGeoJSON'
		>[];
		aggregated = rowsParseGeometryGeoJSON<ArrayElement<typeof aggregated_>, LineString>(
			aggregated_
		);
	}

	if (fields.includes('envelope')) {
		const aggregated_ = aggregated as WithRequired<
			ArrayElement<typeof aggregated>,
			'envelopeGeoJSON'
		>[];
		aggregated = rowsParseEnvelopeGeoJSON<ArrayElement<typeof aggregated_>, Polygon>(
			aggregated_
		);
	}

	return aggregated;
};

const getLineColumns = (fields: (keyof Omit<Line, 'id'>)[], options?: LineColumnsOptions) => {
	return {
		id: linesTable.id,
		...(fields.includes('title') && { title: linesTable.title }),
		...(fields.includes('timestamp') && { timestamp: linesTable.timestamp }),
		...(fields.includes('geometry') &&
			!options?.simplify && {
				geometryGeoJSON: sql<string>` AsGeoJSON (${linesTable.geometry}) `,
			}),
		...(fields.includes('geometry') &&
			options?.simplify && {
				geometryGeoJSON: sql<string>`
					AsGeoJSON (
						Simplify (
							${linesTable.geometry},
							${options.simplify}
						)
					)
				`,
			}),
		...(fields.includes('envelope') && {
			envelopeGeoJSON: sql<string>`AsGeoJSON (ST_Envelope (${linesTable.geometry}))`,
		}),
		...(fields.includes('stats') && {
			length: STATS_SQL.length,
			uphill: STATS_SQL.uphill,
			downhill: STATS_SQL.downhill,
			minZ: STATS_SQL.minZ,
			maxZ: STATS_SQL.maxZ,
		}),
		...(fields.includes('data') && { data: linesTable.data }),
	};
};

const fetchLinesWithoutTags = (params?: FetchLinesWithoutTagsParams) => {
	const {
		lineIds, //
		limit,
		fieldsInclude,
		fieldsExclude,
		simplify,
		sort,
		filters,
		filterLogic,
	} = params ?? {};


		const { sqlFilters, regexFilters } = extractRegexFilters(filters);
	let fields: (keyof Omit<Line, 'id'>)[] = [
		'title',
		'geometry',
		'envelope',
		'timestamp',
		'stats',
	];
	if (fieldsInclude) {
		fields = intersection(fields, fieldsInclude);
	}
	if (fieldsExclude) {
		fields = difference(fields, fieldsExclude);
	}

	return new Promise<LinePartial[]>((resolve, reject) => {
		if (!dbConnection?.drizzle) {
			reject(new Error('ERROR dbZ undefined'));
			return;
		}
		const query = dbConnection.drizzle
			.select(getLineColumns(fields, { simplify }))
			.from(linesTable);

		const filterClause = buildWhereClause(sqlFilters, filterLogic);
		query.where(and(lineIds ? inArray(linesTable.id, lineIds) : undefined, filterClause));

		const orderByClause = buildOrderByClause(sort);
		query.orderBy(orderByClause ?? desc(linesTable.timestamp));

		if (limit !== undefined) {
			query.limit(limit);
		} else if (lineIds) {
			query.limit(lineIds.length);
		}

		query
			.then((rows) => {
				resolve(applyRegexFilters(parseRows(rows, fields), regexFilters));
			})
			.catch((err) => {
				reject(err);
			});
	});
};

const fetchLinesWithTags = (params?: FetchLinesWithTagsParams) => {
	const {
		lineIds, //
		allLines,
		tagId,
		limit,
		fieldsInclude,
		fieldsExclude,
		simplify,
		sort,
		filters,
		filterLogic,
	} = {
		allLines: true,
		...(params ?? {}),
	};

		const { sqlFilters, regexFilters } = extractRegexFilters(filters);

	let fields: (keyof Omit<Line, 'id'>)[] = [
		'title',
		'geometry',
		'envelope',
		'timestamp',
		'tags',
		'stats',
	];
	if (fieldsInclude) {
		fields = intersection(fields, fieldsInclude);
	}
	if (fieldsExclude) {
		fields = difference(fields, fieldsExclude);
	}

	if (!(fields as string[]).includes('tags')) {
		return fetchLinesWithoutTags(params as FetchLinesWithoutTagsParams);
	}

	return new Promise<LinePartial[]>((resolve, reject) => {
		if (!dbConnection?.drizzle) {
			reject(new Error('ERROR dbZ undefined'));
			return;
		}

		// Start from linesTable and LEFT JOIN outwards.  Avoids RIGHT
		// JOIN, which is not supported by the SQLite version shipped
		// on Android ≤ 13 (SQLite < 3.39.0).
		const query = dbConnection.drizzle
			.select({
				line: getLineColumns(fields, { simplify }),
				tag: {
					id: tagsTable.id,
					label: tagsTable.label,
					notes: tagsTable.notes,
					data: tagsTable.data,
				},
			})
			.from(linesTable)
			.leftJoin(tagsToLinesTable, eq(tagsToLinesTable.line_id, linesTable.id))
			.leftJoin(tagsTable, eq(tagsToLinesTable.tag_id, tagsTable.id));

		const filterClause = buildWhereClause(sqlFilters, filterLogic);
		query.where(
			and(
				lineIds ? inArray(linesTable.id, lineIds) : undefined,
				tagId ? eq(tagsTable.id, tagId) : undefined,
				filterClause
			)
		);

		const orderByClause = buildOrderByClause(sort);
		query.orderBy(orderByClause ?? desc(linesTable.timestamp));

		if (limit !== undefined) {
			query.limit(limit);
		} else if (allLines && lineIds) {
			query.limit(lineIds.length);
		}

		query
			.then((rows) => {
				const aggregated = Array.from(
					(
						rows as {
							line: {
								id: number;
								title?: string | null;
								timestamp?: string;
								geometryGeoJSON?: string;
								envelopeGeoJSON?: string;
								length?: string;
								uphill?: string;
								downhill?: string;
								minZ?: string;
								maxZ?: string;
							};
							tag: Tag | null;
						}[]
					)
						.reduce<
							Map<
								number, // line.id
								Partial<
									Omit<Line, 'geometry' | 'envelope'> & {
										geometryGeoJSON: string;
										envelopeGeoJSON: string;
									}
								> & {
									id: number;
									tags: Tag[];
								}
							>
						>((acc, row) => {
							if (row?.line?.id && !acc.has(row.line.id)) {
								acc.set(row.line.id, {
									id: row.line.id,
									...omit(row.line, statsFields),
									...(fields.includes('stats') && {
										stats: mapValues(
											pick(row.line, statsFields),
											(str: string) => parseFloat(str)
										),
									}),
									tags: [],
								});
							}
							if (row?.tag && row?.line?.id) {
								acc.get(row.line.id)!.tags.push(row.tag);
							}
							return acc;
						}, new Map())
						.values()
				);
				resolve(applyRegexFilters(parseRows(aggregated, fields), regexFilters));
			})
			.catch((err) => {
				reject(err);
			});
	});
};

export { fetchLinesWithTags as fetchLines };
