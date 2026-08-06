/**
 * External dependencies
 */
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import { isEqual, uniq } from 'lodash-es';

/**
 * Internal dependencies
 */
import { SliceSettingsBase } from '../../types';
import { selectSelected } from './selectors';
import { AppThunk } from '../../store/store';
import {
	LinePartial,
	TableColumn,
	SortState,
	ColumnFilter,
	NumericColumnFilter,
	DateColumnFilter,
	FilterLogic,
	getFilterKey,
} from './types';

export interface TagsTableSettings {
	tableColumns: TableColumn[];
	sort: SortState | null;
	filters: ColumnFilter[];
	filterLogic: FilterLogic;
}

export interface LinesTableSettings {
	tableColumns: TableColumn[];
	sort: SortState | null;
	filters: ColumnFilter[];
	filterLogic: FilterLogic;
}

export interface LinesSettings {
	selected: number[];
	useSimplification: boolean;
	tagBadgeMode: 'outlined' | 'contained';
	tagsTable: TagsTableSettings;
	linesTable: LinesTableSettings;
}

export interface LinesState extends SliceSettingsBase, LinesSettings {
	lineTemp?: LinePartial;
	tagTemp?: { id: number; label?: string | null; notes?: string | null; data?: any } | null;
}

export const initialSettings: LinesSettings = {
	selected: [],
	useSimplification: true,
	tagBadgeMode: 'outlined',
	tagsTable: {
		tableColumns: [],
		sort: null,
		filters: [],
		filterLogic: 'and',
	},
	linesTable: {
		tableColumns: [],
		sort: null,
		filters: [],
		filterLogic: 'and',
	},
};

const initialState: LinesState = {
	initialized: false,
	...initialSettings,
};

// Slices contain Redux reducer logic for updating state, and
// generate actions that can be dispatched to trigger those updates.
export const linesSlice = createSlice({
	name: 'lines',
	initialState,
	reducers: {
		setInitialized: (state, action: PayloadAction<boolean>) => {
			state.initialized = action.payload;
		},
		setLineTemp: (state, action: PayloadAction<LinesState['lineTemp']>) => {
			state.lineTemp = action.payload;
		},
		setTagBadgeMode: (state, action: PayloadAction<LinesState['tagBadgeMode']>) => {
			state.tagBadgeMode = action.payload;
		},
		setUseSimplification: (
			state,
			action: PayloadAction<LinesSettings['useSimplification']>
		) => {
			state.useSimplification = action.payload;
		},
		setTagTemp: (state, action: PayloadAction<LinesState['tagTemp']>) => {
			state.tagTemp = action.payload;
		},
		setLinesTableColumns: (
			state,
			action: PayloadAction<LinesState['linesTable']['tableColumns']>
		) => {
			state.linesTable.tableColumns = action.payload;
		},
		setSelected: (state, action: PayloadAction<LinesState['selected']>) => {
			state.selected = uniq(action.payload).sort((a, b) => {
				return a - b;
			});
		},
		setLinesSort: (state, action: PayloadAction<LinesState['linesTable']['sort']>) => {
			state.linesTable.sort = action.payload;
		},
		setLinesFilters: (state, action: PayloadAction<LinesState['linesTable']['filters']>) => {
			// Normalize string/tags values to lowercase so persistence
			// never stores mixed-case, then deduplicate by key.
			const seen = new Set<string>();
			state.linesTable.filters = action.payload
				.map((f) =>
					f.type === 'string' || f.type === 'tags'
						? { ...f, value: f.value.toLowerCase() }
						: f
				)
				.filter((f) => {
					const k = getFilterKey(f);
					if (seen.has(k)) return false;
					seen.add(k);
					return true;
				});
		},
		upsertLinesFilter: (state, action: PayloadAction<ColumnFilter>) => {
			// Normalize the value to lowercase for text-based filter
			// types so stored data matches the composite key.
			const payload =
				action.payload.type === 'string' || action.payload.type === 'tags'
					? { ...action.payload, value: action.payload.value.toLowerCase() }
					: action.payload;

			// Numeric/date: merge into any existing same-column filter
			// so there is always at most one filter per column
			// (displayed as a single range badge).  The modal's
			// key-migration logic handles the clear-bound case by
			// deleting the old entry before save, so ?? fallback is
			// safe here.
			if (payload.type === 'numeric' || payload.type === 'date') {
				const colIdx = state.linesTable.filters.findIndex(
					(f) =>
						(f.type === 'numeric' || f.type === 'date') &&
						f.type === payload.type &&
						f.columnKey === payload.columnKey
				);
				if (colIdx !== -1) {
					const existing = state.linesTable.filters[colIdx] as
						| NumericColumnFilter
						| DateColumnFilter;
					state.linesTable.filters[colIdx] = {
						type: existing.type,
						columnKey: existing.columnKey,
						min: payload.min ?? existing.min,
						max: payload.max ?? existing.max,
					} as ColumnFilter;
					return;
				}
				state.linesTable.filters.push(payload);
				return;
			}

			// String/tags: keyed by composite key
			// (columnKey + operator + value) → multiple filters
			// per column with different operator/value combos.
			const targetKey = getFilterKey(payload);
			const idx = state.linesTable.filters.findIndex((f) => getFilterKey(f) === targetKey);
			if (idx !== -1) {
				state.linesTable.filters[idx] = payload;
			} else {
				state.linesTable.filters.push(payload);
			}
		},
		removeLinesFilter: (state, action: PayloadAction<ColumnFilter>) => {
			const targetKey = getFilterKey(action.payload);
			state.linesTable.filters = state.linesTable.filters.filter(
				(f) => getFilterKey(f) !== targetKey
			);
		},

		resetLinesFilters: (state) => {
			state.linesTable.filters = [];
		},
		setLinesFilterLogic: (
			state,
			action: PayloadAction<LinesState['linesTable']['filterLogic']>
		) => {
			state.linesTable.filterLogic = action.payload;
		},
		setTagsTableColumns: (
			state,
			action: PayloadAction<LinesState['tagsTable']['tableColumns']>
		) => {
			state.tagsTable.tableColumns = action.payload;
		},
		setTagsSort: (state, action: PayloadAction<LinesState['tagsTable']['sort']>) => {
			state.tagsTable.sort = action.payload;
		},
		setTagsFilters: (state, action: PayloadAction<LinesState['tagsTable']['filters']>) => {
			// Normalize string/tags values to lowercase so persistence
			// never stores mixed-case, then deduplicate by key.
			const seen = new Set<string>();
			state.tagsTable.filters = action.payload
				.map((f) =>
					f.type === 'string' || f.type === 'tags'
						? { ...f, value: f.value.toLowerCase() }
						: f
				)
				.filter((f) => {
					const k = getFilterKey(f);
					if (seen.has(k)) return false;
					seen.add(k);
					return true;
				});
		},
		upsertTagsFilter: (state, action: PayloadAction<ColumnFilter>) => {
			// Normalize the value to lowercase for text-based filter
			// types so stored data matches the composite key.
			const payload =
				action.payload.type === 'string' || action.payload.type === 'tags'
					? { ...action.payload, value: action.payload.value.toLowerCase() }
					: action.payload;

			// Numeric/date: merge into any existing same-column filter
			// so there is always at most one filter per column.
			if (payload.type === 'numeric' || payload.type === 'date') {
				const colIdx = state.tagsTable.filters.findIndex(
					(f) =>
						(f.type === 'numeric' || f.type === 'date') &&
						f.type === payload.type &&
						f.columnKey === payload.columnKey
				);
				if (colIdx !== -1) {
					const existing = state.tagsTable.filters[colIdx] as
						| NumericColumnFilter
						| DateColumnFilter;
					state.tagsTable.filters[colIdx] = {
						type: existing.type,
						columnKey: existing.columnKey,
						min: payload.min ?? existing.min,
						max: payload.max ?? existing.max,
					} as ColumnFilter;
					return;
				}
				state.tagsTable.filters.push(payload);
				return;
			}

			// String/tags: keyed by composite key.
			const targetKey = getFilterKey(payload);
			const idx = state.tagsTable.filters.findIndex((f) => getFilterKey(f) === targetKey);
			if (idx !== -1) {
				state.tagsTable.filters[idx] = payload;
			} else {
				state.tagsTable.filters.push(payload);
			}
		},
		removeTagsFilter: (state, action: PayloadAction<ColumnFilter>) => {
			const targetKey = getFilterKey(action.payload);
			state.tagsTable.filters = state.tagsTable.filters.filter(
				(f) => getFilterKey(f) !== targetKey
			);
		},
		resetTagsFilters: (state) => {
			state.tagsTable.filters = [];
		},
		setTagsFilterLogic: (
			state,
			action: PayloadAction<LinesState['tagsTable']['filterLogic']>
		) => {
			state.tagsTable.filterLogic = action.payload;
		},
	},
});

// Export the generated action creators for use in components.
export const {
	setInitialized,
	setTagBadgeMode,
	setUseSimplification,
	setLinesTableColumns,
	setSelected,
	setLineTemp,
	setTagTemp,
	setLinesSort,
	setLinesFilters,
	upsertLinesFilter,
	removeLinesFilter,
	resetLinesFilters,
	setLinesFilterLogic,
	setTagsTableColumns,
	setTagsSort,
	setTagsFilters,
	upsertTagsFilter,
	removeTagsFilter,
	resetTagsFilters,
	setTagsFilterLogic,
} = linesSlice.actions;

// Export the slice reducer for use in the store configuration
export default linesSlice.reducer;

export const setLineSelected = (id: number, isSelected?: boolean): AppThunk => {
	return (dispatch, getState) => {
		const selected = selectSelected(getState());
		const idx = selected.indexOf(id);
		// Nothing to do, get out.
		if (
			undefined !== isSelected &&
			((-1 === idx && !isSelected) || (-1 !== idx && isSelected))
		) {
			return;
		}
		// Create new array, add/remove element and dispatch.
		const newSelected = [...selected];
		if (-1 === idx) {
			newSelected.push(id);
		} else {
			newSelected.splice(idx, 1);
		}
		dispatch(linesSlice.actions.setSelected(newSelected));
	};
};

export const setLinesSelected = (newSelectedIds: number[]): AppThunk => {
	return (dispatch, getState) => {
		const selected = selectSelected(getState());
		const newSelected = [...newSelectedIds].sort((a, b) => a - b);
		if (!isEqual(selected, newSelected)) {
			dispatch(linesSlice.actions.setSelected(newSelected));
		}
	};
};

export const toggleLinesSort = (columnKey: string): AppThunk => {
	return (dispatch, getState) => {
		const currentSort = getState().lines.linesTable.sort;
		if (currentSort?.columnKey === columnKey) {
			const newDirection = currentSort.direction === 'asc' ? 'desc' : 'asc';
			dispatch(linesSlice.actions.setLinesSort({ columnKey, direction: newDirection }));
		} else {
			dispatch(linesSlice.actions.setLinesSort({ columnKey, direction: 'asc' }));
		}
	};
};

export const toggleTagsSort = (columnKey: string): AppThunk => {
	return (dispatch, getState) => {
		const currentSort = getState().lines.tagsTable.sort;
		if (currentSort?.columnKey === columnKey) {
			const newDirection = currentSort.direction === 'asc' ? 'desc' : 'asc';
			dispatch(linesSlice.actions.setTagsSort({ columnKey, direction: newDirection }));
		} else {
			dispatch(linesSlice.actions.setTagsSort({ columnKey, direction: 'asc' }));
		}
	};
};

export const onSetDbPath = (): AppThunk => {
	return (dispatch) => {
		dispatch(linesSlice.actions.setSelected([]));
	};
};
