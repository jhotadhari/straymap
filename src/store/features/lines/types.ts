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

export type ColumnFilter = NumericColumnFilter | DateColumnFilter | StringColumnFilter;
