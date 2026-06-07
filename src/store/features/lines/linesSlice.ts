/**
 * External dependencies
 */
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

/**
 * Internal dependencies
 */
import { SliceSettingsBase } from '../../../types';

export interface LinesSettings {
	selectedIds: number[];
}

export interface LinesState extends SliceSettingsBase, LinesSettings {}

export const initialSettings: LinesSettings = {
	selectedIds: [],
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
		setSelectedIds: (state, action: PayloadAction<LinesState['selectedIds']>) => {
			state.selectedIds = action.payload;
		},
	},
});

// Export the generated action creators for use in components.
export const { setInitialized, setSelectedIds } = linesSlice.actions;

// Export the slice reducer for use in the store configuration
export default linesSlice.reducer;
