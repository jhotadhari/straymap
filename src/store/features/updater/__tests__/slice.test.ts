/**
 * Tests for updater slice reducers and selectors.
 */

import updaterReducer, {
	setInitialized,
	setIsUpdating,
	setInstalledVersion,
	initialSettings,
} from '../slice';
import type { UpdaterState } from '../slice';
import { selectInitialized, selectInstalledVersion, selectIsUpdating } from '../selectors';
import type { RootState } from '../../../store';

const buildRoot = (overrides: Partial<UpdaterState> = {}) =>
	({
	updater: {
		initialized: false,
		...initialSettings,
		...overrides,
	},
}) as RootState;

describe('updater slice reducers', () => {
	it('setInitialized', () => {
		const state = updaterReducer(undefined, setInitialized(true));
		expect(state.initialized).toBe(true);
	});

	it('setInstalledVersion sets installed version', () => {
		const state = updaterReducer(undefined, setInstalledVersion('1.0.0'));
		expect(state.installedVersion).toBe('1.0.0');
	});

	it('setIsUpdating sets isUpdating state', () => {
		const results = {
			'1.0.0': { state: 'success' as const },
		};
		const state = updaterReducer(undefined, setIsUpdating(results));
		expect(state.isUpdating).toEqual(results);
	});

	it('setIsUpdating can be set to false', () => {
		const state = updaterReducer(undefined, setIsUpdating(false));
		expect(state.isUpdating).toBe(false);
	});

	it('setIsUpdating can be set to "isDowngrade"', () => {
		const state = updaterReducer(undefined, setIsUpdating('isDowngrade'));
		expect(state.isUpdating).toBe('isDowngrade');
	});

	it('initial state has initialized = false', () => {
		const state = updaterReducer(undefined, { type: '@@INIT' });
		expect(state.initialized).toBe(false);
	});

	it('initial state has isUpdating = undefined', () => {
		const state = updaterReducer(undefined, { type: '@@INIT' });
		expect(state.isUpdating).toBeUndefined();
	});
});

describe('updater selectors', () => {
	it('selectInitialized', () => {
		expect(selectInitialized(buildRoot({ initialized: true }))).toBe(true);
	});

	it('selectInstalledVersion returns undefined when not set', () => {
		expect(selectInstalledVersion(buildRoot({}))).toBeUndefined();
	});

	it('selectInstalledVersion returns version', () => {
		expect(selectInstalledVersion(buildRoot({ installedVersion: '2.0.0' }))).toBe('2.0.0');
	});

	it('selectIsUpdating returns undefined by default', () => {
		expect(selectIsUpdating(buildRoot({}))).toBeUndefined();
	});

	it('selectIsUpdating returns false when set', () => {
		expect(selectIsUpdating(buildRoot({ isUpdating: false }))).toBe(false);
	});

	it('selectIsUpdating returns update results', () => {
		const results = { '1.0': { state: 'updating' as const } };
		expect(selectIsUpdating(buildRoot({ isUpdating: results }))).toEqual(results);
	});
});
