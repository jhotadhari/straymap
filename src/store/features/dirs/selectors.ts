/**
 * External dependencies
 */
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import { RootState } from '../../store';

export const selectInitialized = (state: RootState) => state.dirs.initialized;

export const selectAppDirs = (state: RootState) => state.dirs.appDirs;

export const selectDirsInfoCache = (state: RootState) => state.dirs.dirInfoCache;

export const selectDirsInfoCacheEntry = (state: RootState, id: string) =>
	get(state.dirs.dirInfoCache, id);

export const selectCacheDirsCache = (state: RootState) => state.dirs.cacheDirsCache;
