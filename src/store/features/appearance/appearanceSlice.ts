/**
 * External dependencies
 */
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

/**
 * Internal dependencies
*/
import { SliceSettingsBase } from '../../../types';
import { CursorConfig } from './types';

export interface AppearanceSettings {
	cursor: CursorConfig;
}

export interface AppearanceState extends SliceSettingsBase, AppearanceSettings {}

export const initialSettings : AppearanceSettings = {
	cursor: {
		iconSource: 'target',
		size: 25,
		color: '#ed1c23',
	},
};

const initialState: AppearanceState = {
	initialized: false,
	...initialSettings,
};

// Slices contain Redux reducer logic for updating state, and
// generate actions that can be dispatched to trigger those updates.
export const appearanceSlice = createSlice({
	name: 'appearance',
	initialState,
	reducers: {
		setInitialized: (state, action: PayloadAction<boolean>) => {
			state.initialized = action.payload;
		},
		setCursor: (state, action: PayloadAction<CursorConfig>) => {
			state.cursor = action.payload;
		},
	},
});

// Export the generated action creators for use in components.
export const {
	setInitialized,
	setCursor,
} = appearanceSlice.actions;

// Export the slice reducer for use in the store configuration
export default appearanceSlice.reducer;
