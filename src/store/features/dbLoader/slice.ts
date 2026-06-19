/**
 * External dependencies
 */
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import { ANDROID_DATABASE_PATH } from '@op-engineering/op-sqlite';

/**
 * Internal dependencies
 */
import { SliceSettingsBase } from '../../../types';

export interface DbLoaderSettings {
	dbPath: string;
}

export interface DbLoaderState extends SliceSettingsBase, DbLoaderSettings {
	dbMigrated?: string | true;
}

export const initialSettings: DbLoaderSettings = {
	dbPath: ANDROID_DATABASE_PATH + 'db',
};

const initialState: DbLoaderState = {
	initialized: false,
	...initialSettings,
};

// Slices contain Redux reducer logic for updating state, and
// generate actions that can be dispatched to trigger those updates.
export const dbLoaderSlice = createSlice({
	name: 'dbLoader',
	initialState,
	reducers: {
		setInitialized: (state, action: PayloadAction<boolean>) => {
			state.initialized = action.payload;
		},
		setDbPath: (state, action: PayloadAction<DbLoaderState['dbPath']>) => {
			state.dbPath = action.payload;
		},
		setDbMigrated: (state, action: PayloadAction<DbLoaderState['dbMigrated']>) => {
			state.dbMigrated = action.payload;
		},
	},
});

// Export the generated action creators for use in components.
export const { setInitialized, setDbPath, setDbMigrated } = dbLoaderSlice.actions;

// Export the slice reducer for use in the store configuration
export default dbLoaderSlice.reducer;
