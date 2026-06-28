/**
 * Tests for dirs slice reducers and selectors.
 */

import dirsReducer, {
	setInitialized,
	setAppDirs,
	setDirInfoCache,
	addDirInfoCacheEntry,
	removeDirInfoCacheEntry,
	setCacheDirsCache,
} from '../slice';
import type { DirsState } from '../slice';
import {
	selectInitialized,
	selectAppDirs,
	selectDirsInfoCache,
	selectDirsInfoCacheEntry,
	selectCacheDirsCache,
} from '../selectors';

const buildRoot = (overrides: Partial<DirsState> = {}): { dirs: DirsState } => ({
	dirs: {
		initialized: false,
		appDirs: {},
		dirInfoCache: {},
		cacheDirsCache: [],
		...overrides,
	},
});

describe('dirs slice reducers', () => {
	it('setInitialized', () => {
		const state = dirsReducer(undefined, setInitialized(true));
		expect(state.initialized).toBe(true);
	});

	it('setAppDirs replaces app dirs', () => {
		const dirs = { appInternal: '/app' } as any;
		const state = dirsReducer(undefined, setAppDirs(dirs));
		expect(state.appDirs).toEqual(dirs);
	});

	it('setDirInfoCache replaces entire cache', () => {
		const cache = { key1: { name: '/test' } } as any;
		const state = dirsReducer(undefined, setDirInfoCache(cache));
		expect(state.dirInfoCache).toEqual(cache);
	});

	it('addDirInfoCacheEntry adds or updates a single cache entry', () => {
		const prev: DirsState = {
			initialized: false,
			appDirs: {},
			dirInfoCache: { existing: { name: '/old' } } as any,
			cacheDirsCache: [],
		};
		const state = dirsReducer(
			prev,
			addDirInfoCacheEntry({ id: 'newKey', entry: { name: '/new' } as any })
		);
		expect(state.dirInfoCache).toHaveProperty('existing');
		expect(state.dirInfoCache).toHaveProperty('newKey');
		expect(state.dirInfoCache.newKey).toEqual({ name: '/new' });
	});

	it('removeDirInfoCacheEntry removes an entry', () => {
		const prev: DirsState = {
			initialized: false,
			appDirs: {},
			dirInfoCache: { key1: {} as any, key2: {} as any },
			cacheDirsCache: [],
		};
		const state = dirsReducer(prev, removeDirInfoCacheEntry('key1'));
		expect(state.dirInfoCache).not.toHaveProperty('key1');
		expect(state.dirInfoCache).toHaveProperty('key2');
	});

	it('removeDirInfoCacheEntry no-op for missing key', () => {
		const prev: DirsState = {
			initialized: false,
			appDirs: {},
			dirInfoCache: { key1: {} as any },
			cacheDirsCache: [],
		};
		const state = dirsReducer(prev, removeDirInfoCacheEntry('nonexistent'));
		expect(state.dirInfoCache).toEqual({ key1: {} });
	});

	it('setCacheDirsCache replaces cache dirs', () => {
		const caches = [{ path: '/cache', caches: [] }] as any;
		const state = dirsReducer(undefined, setCacheDirsCache(caches));
		expect(state.cacheDirsCache).toEqual(caches);
	});

	it('initial state is not initialized', () => {
		const state = dirsReducer(undefined, { type: '@@INIT' });
		expect(state.initialized).toBe(false);
		expect(state.appDirs).toEqual({});
		expect(state.dirInfoCache).toEqual({});
	});
});

describe('dirs selectors', () => {
	it('selectInitialized', () => {
		expect(selectInitialized(buildRoot({ initialized: true }))).toBe(true);
	});

	it('selectAppDirs', () => {
		const dirs = { appInternal: '/test' } as any;
		expect(selectAppDirs(buildRoot({ appDirs: dirs }))).toEqual(dirs);
	});

	it('selectDirsInfoCache returns the full cache', () => {
		const cache = { id1: { name: '/test' } } as any;
		expect(selectDirsInfoCache(buildRoot({ dirInfoCache: cache }))).toEqual(cache);
	});

	it('selectDirsInfoCacheEntry returns a specific entry', () => {
		const cache = { id1: { name: '/test1' }, id2: { name: '/test2' } } as any;
		expect(selectDirsInfoCacheEntry(buildRoot({ dirInfoCache: cache }), 'id1')).toEqual({
			name: '/test1',
		});
	});

	it('selectDirsInfoCacheEntry returns undefined for missing id', () => {
		expect(selectDirsInfoCacheEntry(buildRoot({}), 'missing')).toBeUndefined();
	});

	it('selectCacheDirsCache', () => {
		const caches = [{ path: '/c' }] as any;
		expect(selectCacheDirsCache(buildRoot({ cacheDirsCache: caches }))).toEqual(caches);
	});
});
