/**
 * Internal dependencies
 */
import { ColumnFilter, FilterLogic, getFilterKey } from '../types';

export interface FilterConflict {
	filterKeys: string[];
	descriptionKey: string;
	descriptionParams: Record<string, string | number>;
}

/**
 * Detects contradictory filter combinations that can never produce
 * results under AND logic.  Returns an empty array for OR logic or
 * when fewer than 2 filters are active.
 */
export const detectFilterConflicts = (
	filters: ColumnFilter[],
	filterLogic: FilterLogic
): FilterConflict[] => {
	if (filterLogic !== 'and' || filters.length < 2) return [];

	const conflicts: FilterConflict[] = [];

	// (a) Numeric / date: min > max within a single range filter
	for (const f of filters) {
		if (
			(f.type === 'numeric' || f.type === 'date') &&
			f.min !== undefined &&
			f.max !== undefined &&
			f.min > f.max
		) {
			conflicts.push({
				filterKeys: [getFilterKey(f)],
				descriptionKey: 'lines.filterConflictNumericRange',
				descriptionParams: {
					column: f.columnKey,
					min: typeof f.min === 'number' ? f.min : 0,
					max: typeof f.max === 'number' ? f.max : 0,
				},
			});
		}
	}

	// (b) String: includes "X" AND excludes "X" on same column
	// (c) String: multiple startsWith where neither is a prefix of the other
	// (d) String: multiple endsWith where neither is a suffix of the other
	const stringFilters = filters.filter(
		(f): f is Extract<ColumnFilter, { type: 'string' }> => f.type === 'string'
	);
	const strByCol = new Map<string, typeof stringFilters>();
	for (const f of stringFilters) {
		const arr = strByCol.get(f.columnKey) ?? [];
		arr.push(f);
		strByCol.set(f.columnKey, arr);
	}
	for (const [, colFilters] of strByCol) {
		// (b) includes vs excludes same value
		const incs = colFilters.filter((f) => f.operator === 'includes' && f.value);
		const excs = colFilters.filter((f) => f.operator === 'excludes' && f.value);
		for (const inc of incs) {
			for (const exc of excs) {
				if (inc.value.toLowerCase() === exc.value.toLowerCase()) {
					conflicts.push({
						filterKeys: [getFilterKey(inc), getFilterKey(exc)],
						descriptionKey: 'lines.filterConflictString',
						descriptionParams: {
							column: inc.columnKey,
							value: inc.value,
						},
					});
				}
			}
		}

		// (c) multiple startsWith — conflict when neither is a prefix of the other
		const starts = colFilters.filter((f) => f.operator === 'startsWith' && f.value);
		for (let i = 0; i < starts.length; i++) {
			for (let j = i + 1; j < starts.length; j++) {
				const a = starts[i].value.toLowerCase();
				const b = starts[j].value.toLowerCase();
				if (!a.startsWith(b) && !b.startsWith(a)) {
					conflicts.push({
						filterKeys: [getFilterKey(starts[i]), getFilterKey(starts[j])],
						descriptionKey: 'lines.filterConflictStartsWith',
						descriptionParams: {
							column: starts[i].columnKey,
							value1: a,
							value2: b,
						},
					});
				}
			}
		}

		// (d) multiple endsWith — conflict when neither is a suffix of the other
		const ends = colFilters.filter((f) => f.operator === 'endsWith' && f.value);
		for (let i = 0; i < ends.length; i++) {
			for (let j = i + 1; j < ends.length; j++) {
				const a = ends[i].value.toLowerCase();
				const b = ends[j].value.toLowerCase();
				if (!a.endsWith(b) && !b.endsWith(a)) {
					conflicts.push({
						filterKeys: [getFilterKey(ends[i]), getFilterKey(ends[j])],
						descriptionKey: 'lines.filterConflictEndsWith',
						descriptionParams: {
							column: ends[i].columnKey,
							value1: a,
							value2: b,
						},
					});
				}
			}
		}
	}

	// (c) Tags: has "X" AND notHas "X"
	const tagFilters = filters.filter(
		(f): f is Extract<ColumnFilter, { type: 'tags' }> => f.type === 'tags'
	);
	const tagByCol = new Map<string, typeof tagFilters>();
	for (const f of tagFilters) {
		const arr = tagByCol.get(f.columnKey) ?? [];
		arr.push(f);
		tagByCol.set(f.columnKey, arr);
	}
	for (const [, colFilters] of tagByCol) {
		const has = colFilters.filter((f) => f.operator === 'has' && f.value);
		const nots = colFilters.filter((f) => f.operator === 'notHas' && f.value);
		for (const h of has) {
			for (const n of nots) {
				if (h.value.toLowerCase() === n.value.toLowerCase()) {
					conflicts.push({
						filterKeys: [getFilterKey(h), getFilterKey(n)],
						descriptionKey: 'lines.filterConflictTags',
						descriptionParams: { value: h.value },
					});
				}
			}
		}
	}

	return conflicts;
};
