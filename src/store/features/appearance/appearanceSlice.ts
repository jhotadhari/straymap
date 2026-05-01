/**
 * External dependencies
 */
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

/**
 * Internal dependencies
 */

export type CursorConfig = {
	iconSource: string;
	size: number;
	color: string;
};

export interface AppearanceSettings {
	cursor: CursorConfig;
}

export const initialSettings : AppearanceSettings = {
	cursor: {
		iconSource: 'target',
		size: 25,
		color: '#ed1c23',
	},
};

export interface AppearanceState extends AppearanceSettings {
	initialized: boolean;
}

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
