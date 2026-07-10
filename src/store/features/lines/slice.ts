/**
 * External dependencies
 */
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import { isEqual, uniq } from 'lodash-es';

/**
 * Internal dependencies
 */
import { SliceSettingsBase } from '../../../types';
import { selectSelected } from './selectors';
import { AppThunk } from '../../store';
import {
	LinePartial,
	TableColumn,
	SortState,
	ColumnFilter,
	FilterLogic,
	getFilterKey,
} from './types';

export interface TagsTableSettings {
	tableColumns: TableColumn[];
	sort: SortState | null;
	filters: ColumnFilter[];
	filterLogic: FilterLogic;
}

export interface LinesSettings {
	selected: {
		id: number;
		visible: boolean;
	}[];
	tableColumns: TableColumn[];
	sort: SortState | null;
	filters: ColumnFilter[];
	filterLogic: FilterLogic;
	tagsTable: TagsTableSettings;
}

export interface LinesState extends SliceSettingsBase, LinesSettings {
	lineTemp?: LinePartial;
}

export const initialSettings: LinesSettings = {
	selected: [],
	tableColumns: [],
	sort: null,
	filters: [],
	filterLogic: 'and',
	tagsTable: {
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
		setTableColumns: (state, action: PayloadAction<LinesState['tableColumns']>) => {
			state.tableColumns = action.payload;
		},
		setSelected: (state, action: PayloadAction<LinesState['selected']>) => {
			state.selected = uniq(action.payload).sort((a, b) => {
				return a.id - b.id;
			});
		},
		setSort: (state, action: PayloadAction<LinesState['sort']>) => {
			state.sort = action.payload;
		},
		setFilters: (state, action: PayloadAction<LinesState['filters']>) => {
			// Deduplicate by normalized key (handles mixed-case
			// leftovers from persistence).
			const seen = new Set<string>();
			state.filters = action.payload.filter((f) => {
				const k = getFilterKey(f);
				if (seen.has(k)) return false;
				seen.add(k);
				return true;
			});
		},
		upsertFilter: (state, action: PayloadAction<ColumnFilter>) => {
			// Normalize the value to lowercase for text-based filter
			// types so stored data matches the composite key.
			const payload =
				action.payload.type === 'string' || action.payload.type === 'tags'
					? { ...action.payload, value: action.payload.value.toLowerCase() }
					: action.payload;
			const targetKey = getFilterKey(payload);
			const idx = state.filters.findIndex((f) => getFilterKey(f) === targetKey);
			if (idx !== -1) {
				state.filters[idx] = payload;
			} else {
				state.filters.push(payload);
			}
		},
		removeFilter: (state, action: PayloadAction<ColumnFilter>) => {
			const targetKey = getFilterKey(action.payload);
			state.filters = state.filters.filter((f) => getFilterKey(f) !== targetKey);
		},

		resetFilters: (state) => {
			state.filters = [];
		},
		setFilterLogic: (state, action: PayloadAction<LinesState['filterLogic']>) => {
			state.filterLogic = action.payload;
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
			const seen = new Set<string>();
			state.tagsTable.filters = action.payload.filter((f) => {
				const k = getFilterKey(f);
				if (seen.has(k)) return false;
				seen.add(k);
				return true;
			});
		},
		upsertTagsFilter: (state, action: PayloadAction<ColumnFilter>) => {
			const payload =
				action.payload.type === 'string' || action.payload.type === 'tags'
					? { ...action.payload, value: action.payload.value.toLowerCase() }
					: action.payload;
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
	setTableColumns,
	setSelected,
	setLineTemp,
	setSort,
	setFilters,
	upsertFilter,
	removeFilter,
	resetFilters,
	setFilterLogic,
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

export const setLineVisible = (id: number, visible?: boolean): AppThunk => {
	return (dispatch, getState) => {
		const selected = selectSelected(getState());
		const idx = selected.findIndex((a) => a.id === id);
		if (-1 === idx) {
			return;
		}
		const newSelected = [...selected];
		newSelected.splice(idx, 1, {
			...selected[idx],
			visible: undefined !== visible ? visible : !selected[idx].visible,
		});
		dispatch(linesSlice.actions.setSelected(newSelected));
	};
};

export const setLineSelected = (id: number, isSelected?: boolean): AppThunk => {
	return (dispatch, getState) => {
		const selected = selectSelected(getState());
		const idx = selected.findIndex((a) => a.id === id);
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
			newSelected.push({
				id,
				visible: true,
			});
		} else {
			newSelected.splice(idx, 1);
		}
		dispatch(linesSlice.actions.setSelected(newSelected));
	};
};

export const setLinesSelected = (newSelectedIds: number[]): AppThunk => {
	return (dispatch, getState) => {
		const selected = selectSelected(getState());
		const selectedMap = new Map(selected.map((item) => [item.id, item]));
		const newSelected = [...newSelectedIds]
			.sort((a, b) => a - b)
			.map((newSelectedId) => ({
				id: newSelectedId,
				...(selectedMap.get(newSelectedId) ?? {}),
				visible: true,
			}));
		if (!isEqual(selected, newSelected)) {
			dispatch(linesSlice.actions.setSelected(newSelected));
		}
	};
};

export const toggleSort = (columnKey: string): AppThunk => {
	return (dispatch, getState) => {
		const currentSort = getState().lines.sort;
		if (currentSort?.columnKey === columnKey) {
			const newDirection = currentSort.direction === 'asc' ? 'desc' : 'asc';
			dispatch(linesSlice.actions.setSort({ columnKey, direction: newDirection }));
		} else {
			dispatch(linesSlice.actions.setSort({ columnKey, direction: 'asc' }));
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
