/**
 * Internal dependencies
 */
import { LinePartial, SortDirection } from '../types';

/**
 * Column keys offered for sorting the selected-lines drawer list —
 * the same sortable fields the lines browser table offers (minus the
 * technical `id`/`import_source_path` and the tag aggregation).
 */
export const DRAWER_SORT_COLUMN_KEYS = [
	'title',
	'custom_date',
	'created_at',
	'modified_at',
	'length',
	'uphill',
	'downhill',
	'minZ',
	'maxZ',
] as const;

const getSortValue = (line: LinePartial, columnKey: string): string | number | null => {
	switch (columnKey) {
		case 'title':
			return line.title ?? null;
		case 'custom_date':
			return line.custom_date ?? null;
		case 'created_at':
			return line.created_at ?? null;
		case 'modified_at':
			return line.modified_at ?? null;
		case 'length':
			return line.stats?.length ?? null;
		case 'uphill':
			return line.stats?.uphill ?? null;
		case 'downhill':
			return line.stats?.downhill ?? null;
		case 'minZ':
			return line.stats?.minZ ?? null;
		case 'maxZ':
			return line.stats?.maxZ ?? null;
		default:
			return null;
	}
};

/**
 * Comparator for the selected-lines drawer list. Null/missing values
 * sort last regardless of direction; strings compare via localeCompare,
 * numbers numerically.
 */
export const compareLinesForSort = (
	columnKey: string,
	direction: SortDirection
): ((a: LinePartial, b: LinePartial) => number) => {
	const factor = direction === 'asc' ? 1 : -1;
	return (a: LinePartial, b: LinePartial): number => {
		const valueA = getSortValue(a, columnKey);
		const valueB = getSortValue(b, columnKey);
		if (valueA === null && valueB === null) {
			return 0;
		}
		if (valueA === null) {
			return 1;
		}
		if (valueB === null) {
			return -1;
		}
		if (typeof valueA === 'string' || typeof valueB === 'string') {
			return String(valueA).localeCompare(String(valueB)) * factor;
		}
		return (valueA - valueB) * factor;
	};
};
