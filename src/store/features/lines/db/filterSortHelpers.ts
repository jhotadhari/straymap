/**
 * External dependencies
 */
import { sql, asc, desc, like, notLike, gte, lte, and, or, SQL } from 'drizzle-orm';

/**
 * Internal dependencies
 */
import { dbConnection } from '../../dbLoader/DBConnection';
import { linesTable } from './schema/schema';
import {
	ColumnFilter,
	DateColumnFilter,
	FilterLogic,
	NumericColumnFilter,
	SortState,
	StringColumnFilter,
	StringFilterOperator,
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
	const conditions: (SQL | undefined)[] = [];
	if (filter.min !== undefined) {
		conditions.push(gte(linesTable.timestamp, filter.min));
	}
	if (filter.max !== undefined) {
		conditions.push(lte(linesTable.timestamp, filter.max));
	}
	if (!conditions.length) {
		return undefined;
	}
	return and(...conditions);
};

const buildStringWhere = (filter: StringColumnFilter): SQL | undefined => {
	if (!filter.value) {
		return undefined;
	}
	if (filter.operator === 'regex') {
		// SQLite REGEXP operator: x REGEXP y calls regexp(y, x).
		// SpatiaLite 5+ may register regexp(); if unavailable, callers
		// must pre-split regex filters via extractRegexFilters() and
		// apply them in JS.  Throw a clear error rather than letting
		// SQLite return a cryptic "no such function: REGEXP".
		if (!dbConnection.regexpAvailable) {
			throw new Error(
				'REGEXP operator is not available — regex filters must be ' +
					'applied in JavaScript via extractRegexFilters()/applyRegexFilters()'
			);
		}
		return sql`${linesTable.title} REGEXP ${filter.value}`;
	}
	const pattern = STRING_OPERATOR_PATTERNS[filter.operator](filter.value);
	if (filter.operator === 'excludes') {
		return notLike(linesTable.title, pattern);
	}
	return like(linesTable.title, pattern);
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

	let expr: ReturnType<typeof sql> | typeof linesTable.timestamp | typeof linesTable.title;

	if (STATS_SQL[sort.columnKey]) {
		expr = STATS_SQL[sort.columnKey];
	} else if (sort.columnKey === 'timestamp') {
		expr = linesTable.timestamp;
	} else if (sort.columnKey === 'title') {
		expr = linesTable.title;
	} else {
		return undefined;
	}

	return sort.direction === 'asc' ? asc(expr) : desc(expr);
};
