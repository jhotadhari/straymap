/**
 * External dependencies
 */
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

/**
 * Internal dependencies
 */
import { SliceSettingsBase } from '../../types';

/** Live GNSS position data — mirrors the native onGnssPosition payload. */
export interface GnssPositionData {
	lng: number;
	lat: number;
	altitude: number | null;
	bearing: number;
	accuracy: number;
	speed: number;
	timestamp: number;
}

export interface GnssSettings {
	isActive: boolean;
}

export interface GnssState extends SliceSettingsBase, GnssSettings {
	/** Live position — runtime only, never persisted. Null until the
	 * first onGnssPosition event, and reset to null when GNSS turns off. */
	position: GnssPositionData | null;
}

export const initialSettings: GnssSettings = {
	isActive: false,
};

const initialState: GnssState = {
	initialized: false,
	...initialSettings,
	position: null,
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
			if (!action.payload) {
				state.position = null;
			}
		},
		setGnssPosition: (state, action: PayloadAction<GnssPositionData | null>) => {
			state.position = action.payload;
		},
	},
});

export const { setInitialized, setIsActive, setGnssPosition } = gnssSlice.actions;

export default gnssSlice.reducer;
