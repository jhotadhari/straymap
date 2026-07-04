/**
 * External dependencies
 */
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

/**
 * Internal dependencies
 */
import { SliceSettingsBase } from '../../../types';

export interface MapEventPayload {
	center?: number[];
}

export interface GnssSettings {
	isActive: boolean;
}

export interface GnssState extends SliceSettingsBase, GnssSettings {}

export const initialSettings: GnssSettings = {
	isActive: true, // GPS tracking is active by default
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
		setMapEvent: (state, action: PayloadAction<MapEventPayload>) => {
			// Passthrough — no state change. The track recording listener
			// middleware watches this action to apply GPS filtering.
		},
	},
});

export const { setInitialized, setIsActive, setMapEvent } = gnssSlice.actions;

export default gnssSlice.reducer;
