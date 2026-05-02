/**
 * External dependencies
 */
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

/**
 * Internal dependencies
*/
import { SliceSettingsBase } from '../../../types';
import { HardwareKeyActionConf } from './types';

export interface GeneralSettings {
	hardwareKeys: HardwareKeyActionConf[];
	// dashboardElements: {
	// 	elements: DashboardElementConf[];
	// 	style: DashboardStyle;
	// };
	// unitPrefs: { [value: string]: UnitPref };
	// mapEventRate: MapContainerProps['mapEventRate'];
}

export interface GeneralState extends SliceSettingsBase, GeneralSettings {}

export const initialSettings : GeneralSettings = {
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
	},
});

// Export the generated action creators for use in components.
export const {
	setInitialized,
	setHardwareKeys,
} = generalSlice.actions;

// Export the slice reducer for use in the store configuration
export default generalSlice.reducer;
