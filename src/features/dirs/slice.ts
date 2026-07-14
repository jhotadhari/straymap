/**
 * External dependencies
 */
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

/**
 * Internal dependencies
 */
import { SliceSettingsBase } from '../../types';
import { AbsPathsMap, CacheDir, DirInfoMap } from './types';
import { set } from 'lodash-es';

export interface DirsSettings {}

export interface DirsState extends SliceSettingsBase, DirsSettings {
	appDirs: AbsPathsMap;
	dirInfoCache: { [id: string]: DirInfoMap };
	cacheDirsCache: CacheDir[];
}

export const initialSettings: DirsSettings = {};

const initialState: DirsState = {
	initialized: false,
	...initialSettings,
	appDirs: {},
	dirInfoCache: {},
	cacheDirsCache: [],
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
		setDirInfoCache: (state, action: PayloadAction<DirsState['dirInfoCache']>) => {
			state.dirInfoCache = action.payload;
		},
		addDirInfoCacheEntry: (
			state,
			action: PayloadAction<{
				id: string;
				entry: DirInfoMap;
			}>
		) => {
			set(state.dirInfoCache, action.payload.id, action.payload.entry);
		},
		removeDirInfoCacheEntry: (state, action: PayloadAction<string>) => {
			delete state.dirInfoCache[action.payload];
		},
		setCacheDirsCache: (state, action: PayloadAction<DirsState['cacheDirsCache']>) => {
			state.cacheDirsCache = action.payload;
		},
	},
});

// Export the generated action creators for use in components.
export const {
	setInitialized,
	setAppDirs,
	setDirInfoCache,
	addDirInfoCacheEntry,
	removeDirInfoCacheEntry,
	setCacheDirsCache,
} = dirsSlice.actions;

// Export the slice reducer for use in the store configuration
export default dirsSlice.reducer;
