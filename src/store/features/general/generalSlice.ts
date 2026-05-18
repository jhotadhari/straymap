/**
 * External dependencies
 */
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import { MapContainerProps } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { SliceSettingsBase } from '../../../types';
import { HardwareKeyActionConf, UnitPref } from './types';

export interface GeneralSettings {
	hardwareKeys: HardwareKeyActionConf[];
	unitPrefs: { [value: string]: UnitPref };
	mapEventRate: MapContainerProps['mapEventRate'];
}

export interface GeneralState extends SliceSettingsBase, GeneralSettings {}

export const initialSettings: GeneralSettings = {
	hardwareKeys: [
		{
			keyCodeString: 'KEYCODE_VOLUME_UP',
			actionKey: 'zoomIn',
		},
		{
			keyCodeString: 'KEYCODE_VOLUME_DOWN',
			actionKey: 'zoomOut',
		},
	],
	unitPrefs: {
		coordinates: {
			unit: 'dd',
			round: 4,
		},
		distance: {
			unit: 'metric',
			round: 2,
		},
		heightDepth: {
			unit: 'm',
			round: 0,
		},
		speed: {
			unit: 'kmh',
			round: 2,
		},
	},
	mapEventRate: 40,
};

const initialState: GeneralState = {
	initialized: false,
	...initialSettings,
};

// Slices contain Redux reducer logic for updating state, and
// generate actions that can be dispatched to trigger those updates.
export const generalSlice = createSlice({
	name: 'general',
	initialState,
	reducers: {
		setInitialized: (state, action: PayloadAction<boolean>) => {
			state.initialized = action.payload;
		},
		setHardwareKeys: (state, action: PayloadAction<GeneralSettings['hardwareKeys']>) => {
			state.hardwareKeys = action.payload;
		},
		setMapEventRate: (state, action: PayloadAction<GeneralSettings['mapEventRate']>) => {
			state.mapEventRate = action.payload;
		},
		setUnitPrefs: (state, action: PayloadAction<GeneralSettings['unitPrefs']>) => {
			state.unitPrefs = action.payload;
		},
	},
});

// Export the generated action creators for use in components.
export const {
	setInitialized,
	setHardwareKeys,
	setMapEventRate,
	setUnitPrefs,
} = generalSlice.actions;

// Export the slice reducer for use in the store configuration
export default generalSlice.reducer;
