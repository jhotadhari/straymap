/**
 * External dependencies
 */
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

/**
 * Internal dependencies
*/
import { SliceSettingsBase } from '../../../types';
import { AbsPathsMap } from './types';

export interface DirsSettings {
}

export interface DirsState extends SliceSettingsBase, DirsSettings {
	appDirs: AbsPathsMap;
}

export const initialSettings : DirsSettings = {
};

const initialState: DirsState = {
	initialized: false,
	...initialSettings,
	appDirs: {},
};

// Slices contain Redux reducer logic for updating state, and
// generate actions that can be dispatched to trigger those updates.
export const dirsSlice = createSlice({
	name: 'dirs',
	initialState,
	reducers: {
		setInitialized: (state, action: PayloadAction<boolean>) => {
			state.initialized = action.payload;
		},
		setAppDirs: (state, action: PayloadAction<DirsState['appDirs']>) => {
			state.appDirs = action.payload;
		},
	},
});

// Export the generated action creators for use in components.
export const {
	setInitialized,
	setAppDirs,
} = dirsSlice.actions;

// Export the slice reducer for use in the store configuration
export default dirsSlice.reducer;
