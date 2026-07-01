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
import { LinePartial, TableColumn } from './types';

export interface LinesSettings {
	selected: {
		id: number;
		visible: boolean;
	}[];
	tableColumns: TableColumn[];
}

export interface LinesState extends SliceSettingsBase, LinesSettings {
	lineTemp?: LinePartial;
}

export const initialSettings: LinesSettings = {
	selected: [],
	tableColumns: [],
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
	},
});

// Export the generated action creators for use in components.
export const { setInitialized, setTableColumns, setSelected, setLineTemp } = linesSlice.actions;

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
		const newSelected = [...newSelectedIds].sort().map((newSelectedId) => ({
			id: newSelectedId,
			...(selected.find((item) => item.id === newSelectedId) ?? {}),
			visible: true,
		}));
		if (!isEqual(selected, newSelected)) {
			dispatch(linesSlice.actions.setSelected(newSelected));
		}
	};
};

export const onSetDbPath = (): AppThunk => {
	return (dispatch) => {
		dispatch(linesSlice.actions.setSelected([]));
	};
};
