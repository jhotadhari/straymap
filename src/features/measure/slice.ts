/**
 * External dependencies
 */
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

/**
 * Internal dependencies
 */
import { SliceSettingsBase } from '../../types';

export interface MeasureState extends SliceSettingsBase {
	/** Active measurement target — runtime only, never persisted. */
	position: { lng: number; lat: number } | null;
}

const initialState: MeasureState = {
	initialized: true,
	position: null,
};

export const measureSlice = createSlice({
	name: 'measure',
	initialState,
	reducers: {
		startMeasurement: (state, action: PayloadAction<{ lng: number; lat: number }>) => {
			state.position = action.payload;
		},
		clearMeasurement: (state) => {
			state.position = null;
		},
	},
});

export const { startMeasurement, clearMeasurement } = measureSlice.actions;

export default measureSlice.reducer;
