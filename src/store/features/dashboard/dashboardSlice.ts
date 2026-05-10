/**
 * External dependencies
 */
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import rnUuid from 'react-native-uuid';

/**
 * Internal dependencies
 */
import { SliceSettingsBase } from '../../../types';
import { DashboardElementConf, DashboardStyle } from './types';

export interface DashboardSettings {
	elements: DashboardElementConf[];
	dashboardStyle: DashboardStyle;
}

export interface DashboardState extends SliceSettingsBase, DashboardSettings {}

export const initialSettings: DashboardSettings = {
	elements: [
		{
			type: 'zoomLevel',
			key: rnUuid.v4(),
		},
		{
			type: 'centerCoordinates',
			key: rnUuid.v4(),
			options: {
				unit: {
					key: 'default',
					round: 4,
				},
			},
		},
	],
	dashboardStyle: {
		align: 'left',
		fontSize: 14,
	},
};

const initialState: DashboardState = {
	initialized: false,
	...initialSettings,
};

// Slices contain Redux reducer logic for updating state, and
// generate actions that can be dispatched to trigger those updates.
export const dashboardSlice = createSlice({
	name: 'dashboard',
	initialState,
	reducers: {
		setInitialized: (state, action: PayloadAction<boolean>) => {
			state.initialized = action.payload;
		},
		setElements: (state, action: PayloadAction<DashboardSettings['elements']>) => {
			state.elements = action.payload;
		},
		setDashboardStyle: (state, action: PayloadAction<DashboardSettings['dashboardStyle']>) => {
			state.dashboardStyle = action.payload;
		},
	},
});

// Export the generated action creators for use in components.
export const { setInitialized, setElements, setDashboardStyle } = dashboardSlice.actions;

// Export the slice reducer for use in the store configuration
export default dashboardSlice.reducer;
