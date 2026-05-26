/**
 * External dependencies
 */
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

/**
 * Internal dependencies
 */
import { SliceSettingsBase } from '../../../types';
import { UpdateResults } from './types';

export interface UpdaterSettings {
	installedVersion?: string;
}

export interface UpdaterState extends SliceSettingsBase, UpdaterSettings {
	isUpdating?: false | UpdateResults | 'isDowngrade';
	dbMigrated?: string | true;
}

export const initialSettings: UpdaterSettings = {
	installedVersion: undefined,
};

const initialState: UpdaterState = {
	initialized: false,
	isUpdating: undefined,
	...initialSettings,
};

// Slices contain Redux reducer logic for updating state, and
// generate actions that can be dispatched to trigger those updates.
export const updaterSlice = createSlice({
	name: 'updater',
	initialState,
	reducers: {
		setInitialized: (state, action: PayloadAction<boolean>) => {
			state.initialized = action.payload;
		},
		setDbMigrated: (state, action: PayloadAction<UpdaterState['dbMigrated']>) => {
			state.dbMigrated = action.payload;
		},
		setIsUpdating: (state, action: PayloadAction<UpdaterState['isUpdating']>) => {
			state.isUpdating = action.payload;
		},
		setInstalledVersion: (
			state,
			action: PayloadAction<UpdaterSettings['installedVersion']>
		) => {
			state.installedVersion = action.payload;
		},
	},
});

// Export the generated action creators for use in components.
export const { setInitialized, setDbMigrated, setIsUpdating, setInstalledVersion } =
	updaterSlice.actions;

// Export the slice reducer for use in the store configuration
export default updaterSlice.reducer;
