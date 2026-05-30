/**
 * External dependencies
 */
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

/**
 * Internal dependencies
 */
import { SliceSettingsBase } from '../../../types';

export interface LinesSettings {}

export interface LinesState extends SliceSettingsBase, LinesSettings {}

export const initialSettings: LinesSettings = {};

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
	},
});

// Export the generated action creators for use in components.
export const { setInitialized } = linesSlice.actions;

// Export the slice reducer for use in the store configuration
export default linesSlice.reducer;
