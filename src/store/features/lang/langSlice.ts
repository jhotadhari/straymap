/**
 * External dependencies
 */
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

/**
 * Internal dependencies
 */
import { SliceSettingsBase } from '../../../types';

export interface LangSettings {
	lang: string;
}

export interface LangState extends SliceSettingsBase, LangSettings {}

export const initialSettings: LangSettings = {
	lang: 'system',
};

const initialState: LangState = {
	initialized: false,
	...initialSettings,
};

// Slices contain Redux reducer logic for updating state, and
// generate actions that can be dispatched to trigger those updates.
export const langSlice = createSlice({
	name: 'lang',
	initialState,
	reducers: {
		setInitialized: (state, action: PayloadAction<boolean>) => {
			state.initialized = action.payload;
		},
		setLang: (state, action: PayloadAction<LangSettings['lang']>) => {
			state.lang = action.payload;
		},
	},
});

// Export the generated action creators for use in components.
export const {
	setInitialized,
	setLang,
} = langSlice.actions;

// Export the slice reducer for use in the store configuration
export default langSlice.reducer;
