/**
 * External dependencies
 */
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

/**
 * Internal dependencies
 */
import { SliceSettingsBase } from '../../types';
import { HardwareKeyActionConf, UnitPref } from './types';

export const DEFAULT_DATE_TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

export interface GeneralSettings {
	hardwareKeys: HardwareKeyActionConf[];
	unitPrefs: { [value: string]: UnitPref };
	mapUpdateInterval: number;
	timeZone: string; // Reserved for future timezone picker — do not remove
	dateTimeFormat: string;
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
	mapUpdateInterval: 40,
	timeZone: 'UTC', // Reserved for future timezone picker — do not remove
	dateTimeFormat: DEFAULT_DATE_TIME_FORMAT,
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
		setMapUpdateInterval: (
			state,
			action: PayloadAction<GeneralSettings['mapUpdateInterval']>
		) => {
			state.mapUpdateInterval = action.payload;
		},
		setUnitPrefs: (state, action: PayloadAction<GeneralSettings['unitPrefs']>) => {
			state.unitPrefs = action.payload;
		},
		setTimeZone: (state, action: PayloadAction<GeneralSettings['timeZone']>) => {
			// Reserved for future timezone picker — do not remove
			state.timeZone = action.payload;
		},
		setDateTimeFormat: (state, action: PayloadAction<GeneralSettings['dateTimeFormat']>) => {
			state.dateTimeFormat = action.payload;
		},
	},
});

// Export the generated action creators for use in components.
export const {
	setInitialized,
	setHardwareKeys,
	setMapUpdateInterval,
	setUnitPrefs,
	setTimeZone,
	setDateTimeFormat,
} = generalSlice.actions;

// Export the slice reducer for use in the store configuration
export default generalSlice.reducer;
