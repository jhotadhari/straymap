/**
 * Tests for dbLoader slice reducers and selectors.
 */

/**
 * Internal dependencies
 */
import dbLoaderReducer, {
	setInitialized,
	setDbPathAction,
	setDbMigrated,
	setRequireReload,
	initialSettings,
} from '../slice';
import type { DbLoaderState } from '../slice';
import type { RootState } from '../../../store/store';
import {
	selectInitialized,
	selectDbPath,
	selectDbMigrated,
	selectRequireReload,
} from '../selectors';

const buildState = (overrides: Partial<DbLoaderState> = {}) =>
	({
		dbLoader: {
			initialized: false,
			...initialSettings,
			...overrides,
		},
	}) as RootState;

describe('dbLoader slice reducers', () => {
	it('setInitialized', () => {
		const state = dbLoaderReducer(undefined, setInitialized(true));
		expect(state.initialized).toBe(true);
	});

	it('setDbPathAction updates dbPath', () => {
		const state = dbLoaderReducer(undefined, setDbPathAction('/custom/path/db.straymapdb'));
		expect(state.dbPath).toBe('/custom/path/db.straymapdb');
	});

	it('setDbMigrated updates migration status', () => {
		const state = dbLoaderReducer(undefined, setDbMigrated('v2'));
		expect(state.dbMigrated).toBe('v2');

		const state2 = dbLoaderReducer(undefined, setDbMigrated(true));
		expect(state2.dbMigrated).toBe(true);
	});

	it('setRequireReload sets reload flag', () => {
		const state = dbLoaderReducer(undefined, setRequireReload(true));
		expect(state.requireReload).toBe(true);

		const state2 = dbLoaderReducer(state, setRequireReload(false));
		expect(state2.requireReload).toBe(false);
	});

	it('initial state has default dbPath', () => {
		const state = dbLoaderReducer(undefined, { type: '@@INIT' });
		expect(state.dbPath).toBeTruthy();
		expect(state.requireReload).toBeUndefined();
		expect(state.dbMigrated).toBeUndefined();
	});
});

describe('dbLoader selectors', () => {
	it('selectInitialized', () => {
		expect(selectInitialized(buildState({ initialized: true }))).toBe(true);
	});

	it('selectDbPath', () => {
		expect(selectDbPath(buildState({ dbPath: '/test/path' }))).toBe('/test/path');
	});

	it('selectDbMigrated', () => {
		expect(selectDbMigrated(buildState({ dbMigrated: true }))).toBe(true);
	});

	it('selectRequireReload', () => {
		expect(selectRequireReload(buildState({ requireReload: true }))).toBe(true);
	});
});
