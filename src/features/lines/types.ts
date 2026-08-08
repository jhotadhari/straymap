/**
 * External dependencies
 */
import { WithRequired } from '@tanstack/react-query';
import { LineString, Polygon } from 'geojson';

export interface Tag {
	id: number;
	timestamp: string;
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
	title: string | null;
	geometry: LineString;
	envelope: Polygon;
	created_at: string;
	modified_at: string;
	custom_date: string | null;
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
 * - numeric/date: keyed by columnKey + which bounds are set (min / max /
 *   min+max) → allows separate min-only and max-only filters per column
 *   while a single range filter (both bounds) gets its own key
 * - string/tags:  keyed by columnKey + operator + value → allows
 *   multiple filters per column with different operator/value combos
 */
export const getFilterKey = (filter: ColumnFilter): string => {
	switch (filter.type) {
		case 'numeric':
		case 'date': {
			const bounds: string[] = [];
			if (filter.min !== undefined) bounds.push('min');
			if (filter.max !== undefined) bounds.push('max');
			return `${filter.type}:${filter.columnKey}:${bounds.join('+') || 'none'}`;
		}
		case 'string':
		case 'tags':
			return `${filter.type}:${filter.columnKey}:${filter.operator}:${filter.value.toLowerCase()}`;
	}
};
