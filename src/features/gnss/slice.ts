/**
 * External dependencies
 */
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

/**
 * Internal dependencies
 */
import { SliceSettingsBase } from '../../types';

export interface GnssSettings {
	isActive: boolean;
}

export interface GnssState extends SliceSettingsBase, GnssSettings {}

export const initialSettings: GnssSettings = {
	isActive: true, // GNSS tracking is active by default
};

const initialState: GnssState = {
	initialized: false,
	...initialSettings,
};

export const gnssSlice = createSlice({
	name: 'gnss',
	initialState,
	reducers: {
		setInitialized: (state, action: PayloadAction<boolean>) => {
			state.initialized = action.payload;
		},
		setIsActive: (state, action: PayloadAction<boolean>) => {
			state.isActive = action.payload;
		},
	},
});

export const { setInitialized, setIsActive } = gnssSlice.actions;

export default gnssSlice.reducer;
