/**
 * External dependencies
 */
import { sql, asc, desc, like, notLike, gte, lte, and, or, SQL } from 'drizzle-orm';

/**
 * Internal dependencies
 */
import { linesTable, tagsTable, tagsToLinesTable } from './schema/schema';
import {
	ColumnFilter,
	DateColumnFilter,
	FilterLogic,
	NumericColumnFilter,
	SortState,
	StringColumnFilter,
	StringFilterOperator,
	TagsColumnFilter,
} from '../types';

/**
 * Shared SpatiaLite SQL expressions for computed stats columns.
 * Used in SELECT, WHERE, and ORDER BY clauses to avoid duplication.
 */
export const STATS_SQL: Record<string, ReturnType<typeof sql>> = {
	length: sql`GreatCircleLength (${linesTable.geometry})`,
	uphill: sql`UphillHeight (${linesTable.geometry})`,
	downhill: sql`DownhillHeight (${linesTable.geometry})`,
	minZ: sql`ST_MinZ (${linesTable.geometry})`,
	maxZ: sql`ST_MaxZ (${linesTable.geometry})`,
};

const STRING_OPERATOR_PATTERNS: Record<
	Exclude<StringFilterOperator, 'regex'>,
	(value: string) => string
> = {
	includes: (v) => `%${v}%`,
	excludes: (v) => `%${v}%`,
	startsWith: (v) => `${v}%`,
	endsWith: (v) => `%${v}`,
};

/**
 * Builds a drizzle WHERE clause from the filters array and logic.
 * Returns undefined when there are no filters.
 */
export const buildWhereClause = (
	filters?: ColumnFilter[],
	filterLogic?: FilterLogic
): SQL | undefined => {
	if (!filters?.length) {
		return undefined;
	}

	const clauses = filters
		.map((filter): SQL | undefined => {
			switch (filter.type) {
				case 'numeric':
					return buildNumericWhere(filter);
				case 'date':
					return buildDateWhere(filter);
				case 'string':
					return buildStringWhere(filter);
				case 'tags':
					return buildTagsWhere(filter);
				default:
					return undefined;
			}
		})
		.filter((c): c is SQL => !!c);

	if (!clauses.length) {
		return undefined;
	}

	return filterLogic === 'or' ? or(...clauses) : and(...clauses);
};

const buildNumericWhere = (filter: NumericColumnFilter): SQL | undefined => {
	const expr = STATS_SQL[filter.columnKey];
	if (!expr) {
		return undefined;
	}
	const conditions: (SQL | undefined)[] = [];
	if (filter.min !== undefined) {
		conditions.push(gte(expr, filter.min));
	}
	if (filter.max !== undefined) {
		conditions.push(lte(expr, filter.max));
	}
	if (!conditions.length) {
		return undefined;
	}
	return and(...conditions);
};

const buildDateWhere = (filter: DateColumnFilter): SQL | undefined => {
	const col = getDateColumn(filter.columnKey);
	if (!col) {
		return undefined;
	}
	const conditions: (SQL | undefined)[] = [];
	if (filter.min !== undefined) {
		conditions.push(gte(col, filter.min));
	}
	if (filter.max !== undefined) {
		conditions.push(lte(col, filter.max));
	}
	if (!conditions.length) {
		return undefined;
	}
	return and(...conditions);
};

const getDateColumn = (
	columnKey: string
):
	| typeof linesTable.created_at
	| typeof linesTable.modified_at
	| typeof linesTable.custom_date
	| undefined => {
	switch (columnKey) {
		case 'created_at':
			return linesTable.created_at;
		case 'modified_at':
			return linesTable.modified_at;
		case 'custom_date':
			return linesTable.custom_date;
		default:
			return undefined;
	}
};

const buildStringWhere = (filter: StringColumnFilter): SQL | undefined => {
	if (!filter.value) {
		return undefined;
	}
	if (filter.operator === 'regex') {
		// SQLite REGEXP operator: x REGEXP y calls regexp(y, x).
		// SpatiaLite 5+ registers regexp(); fetch.ts pre-splits regex
		// filters via extractRegexFilters() when it is unavailable and
		// applies them in JS.  This SQL path is only reached when
		// regexpAvailable is true.  Regex patterns are left as-is
		// (the user can embed case flags in the pattern).
		return sql`${linesTable.title} REGEXP ${filter.value}`;
	}
	// Lower-case both the column and the pattern for case-insensitive
	// matching across the full Unicode range (SQLite LIKE is only
	// case-insensitive for ASCII A-Z).
	const pattern = STRING_OPERATOR_PATTERNS[filter.operator](filter.value.toLowerCase());
	if (filter.operator === 'excludes') {
		return notLike(sql`LOWER(${linesTable.title})`, pattern);
	}
	return like(sql`LOWER(${linesTable.title})`, pattern);
};

const buildTagsWhere = (filter: TagsColumnFilter): SQL | undefined => {
	if (!filter.value) {
		return undefined;
	}
	if (filter.operator === 'has') {
		return sql`
			EXISTS (
				SELECT
					1
				FROM
					${tagsToLinesTable}
					INNER JOIN ${tagsTable} ON ${tagsToLinesTable.tag_id} = ${tagsTable.id}
				WHERE
					${tagsToLinesTable.line_id} = ${linesTable.id}
					AND LOWER(${tagsTable.label}) = LOWER(${filter.value})
			)
		`;
	}
	// notHas
	return sql`
		NOT EXISTS (
			SELECT
				1
			FROM
				${tagsToLinesTable}
				INNER JOIN ${tagsTable} ON ${tagsToLinesTable.tag_id} = ${tagsTable.id}
			WHERE
				${tagsToLinesTable.line_id} = ${linesTable.id}
				AND LOWER(${tagsTable.label}) = LOWER(${filter.value})
		)
	`;
};

/**
 * Builds a drizzle ORDER BY clause from the sort state.
 * Returns undefined when no sort is active (caller should fall back to default).
 */
export const buildOrderByClause = (
	sort?: SortState | null
): ReturnType<typeof asc> | ReturnType<typeof desc> | undefined => {
	if (!sort) {
		return undefined;
	}

	let expr:
		| ReturnType<typeof sql>
		| typeof linesTable.created_at
		| typeof linesTable.modified_at
		| typeof linesTable.custom_date
		| typeof linesTable.title;

	if (STATS_SQL[sort.columnKey]) {
		expr = STATS_SQL[sort.columnKey];
	} else if (sort.columnKey === 'created_at') {
		expr = linesTable.created_at;
	} else if (sort.columnKey === 'modified_at') {
		expr = linesTable.modified_at;
	} else if (sort.columnKey === 'custom_date') {
		expr = linesTable.custom_date;
	} else if (sort.columnKey === 'title') {
		expr = linesTable.title;
	} else {
		return undefined;
	}

	return sort.direction === 'asc' ? asc(expr) : desc(expr);
};
