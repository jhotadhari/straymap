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
import { AppThunk } from '../../store';
import { selectDbPath } from './selectors';
import { setSelected } from '../lines/slice';
import { setIsRouting } from '../routing/slice';
import { dbExtension } from './constants';
import features from '..';

export interface DbLoaderSettings {
	dbPath: string;
}

export interface DbLoaderState extends SliceSettingsBase, DbLoaderSettings {
	dbMigrated?: string | true;
	requireReload?: boolean;
}

export const initialSettings: DbLoaderSettings = {
	dbPath: ANDROID_DATABASE_PATH + 'db.' + dbExtension,
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
		setRequireReload: (state, action: PayloadAction<DbLoaderState['requireReload']>) => {
			state.requireReload = action.payload;
		},
	},
});

// Export the generated action creators for use in components.
export const { setInitialized, setDbPath: setDbPathAction, setDbMigrated, setRequireReload } = dbLoaderSlice.actions;

// Export the slice reducer for use in the store configuration
export default dbLoaderSlice.reducer;

export const setDbPath = (newDbPath: string): AppThunk => {
	return (dispatch, getState) => {
		const dbPath = selectDbPath(getState());
		if ( dbPath === newDbPath ) {
			return;
		}
		Object.values(features).forEach((feature) => {
			if (feature?.onSetDbPath) {
				dispatch(feature.onSetDbPath());
			}
		});
		dispatch(dbLoaderSlice.actions.setDbPath( newDbPath ));
		dispatch(dbLoaderSlice.actions.setRequireReload( true ));
	};
};
