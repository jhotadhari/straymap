/**
 * External dependencies
 */
import { WithRequired } from '@tanstack/react-query';
import { LineString, Polygon } from 'geojson';

export interface Tag {
	id: number;
	label: string | null;
	notes: string | null;
	data: any; // ??? any
}

export const STATS_FIELDS = [
	'length',
	'uphill',
	'downhill',
	'minZ',
	'maxZ',
] as const;

export type LineStats = Partial<Record<(typeof STATS_FIELDS)[number], number>>;

export interface Line {
	id: number;
	title: string | null; // ??? rename to name
	geometry: LineString;
	envelope: Polygon;
	timestamp: string;
	tags: Tag[];
	data: any; // ??? any
	stats: LineStats;
}

export type LinePartial = WithRequired<Partial<Line>, 'id'>;

export interface TableColumn {
	key: string;
	visible: boolean;
}

// ── Sort ────────────────────────────────────────────────────────────

export type SortDirection = 'asc' | 'desc';

export interface SortState {
	columnKey: string;
	direction: SortDirection;
}

// ── Filters ─────────────────────────────────────────────────────────

export type FilterLogic = 'and' | 'or';

export type StringFilterOperator = 'includes' | 'excludes' | 'startsWith' | 'endsWith' | 'regex';

export type TagsFilterOperator = 'has' | 'notHas';

export interface NumericColumnFilter {
	type: 'numeric';
	columnKey: string;
	min?: number;
	max?: number;
}

export interface DateColumnFilter {
	type: 'date';
	columnKey: string;
	min?: string;
	max?: string;
}

export interface StringColumnFilter {
	type: 'string';
	columnKey: string;
	operator: StringFilterOperator;
	value: string;
}

export interface TagsColumnFilter {
	type: 'tags';
	columnKey: string;
	operator: TagsFilterOperator;
	value: string;
}

export type ColumnFilter =
	| NumericColumnFilter
	| DateColumnFilter
	| StringColumnFilter
	| TagsColumnFilter;

// ── Filter identity ──────────────────────────────────────────────────

/**
 * Returns a deterministic composite key that encodes filter uniqueness:
 * - numeric/date: keyed by columnKey only → overwrites same column
 * - string/tags:  keyed by columnKey + operator + value → allows
 *   multiple filters per column with different operator/value combos
 */
export const getFilterKey = (filter: ColumnFilter): string => {
	switch (filter.type) {
		case 'numeric':
		case 'date':
			return `${filter.type}:${filter.columnKey}`;
		case 'string':
		case 'tags':
			return `${filter.type}:${filter.columnKey}:${filter.operator}:${filter.value.toLowerCase()}`;
	}
};
