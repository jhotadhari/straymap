/**
 * Tests for general slice reducers and selectors.
 */

/**
 * Internal dependencies
 */
import generalReducer, {
	setInitialized,
	setHardwareKeys,
	setMapUpdateInterval,
	setUnitPrefs,
	initialSettings,
} from '../slice';
import type { GeneralState } from '../slice';
import type { RootState } from '../../../store/store';
import {
	selectInitialized,
	selectHardwareKeys,
	selectUnitPrefs,
	selectMapUpdateInterval,
} from '../selectors';

const buildState = (overrides: Partial<GeneralState> = {}) =>
	({
		general: {
			initialized: false,
			...initialSettings,
			...overrides,
		},
	}) as RootState;

// ===========================================================================
// Reducers
// ===========================================================================

describe('general slice reducers', () => {
	it('setInitialized updates initialized flag', () => {
		const state = generalReducer(undefined, setInitialized(true));
		expect(state.initialized).toBe(true);

		const state2 = generalReducer(state, setInitialized(false));
		expect(state2.initialized).toBe(false);
	});

	it('setHardwareKeys replaces hardware keys', () => {
		const newKeys = [{ keyCodeString: 'KEYCODE_BACK', actionKey: 'back' }];
		const state = generalReducer(undefined, setHardwareKeys(newKeys));
		expect(state.hardwareKeys).toEqual(newKeys);
		expect(state.hardwareKeys).toHaveLength(1);
	});

	it('setMapUpdateInterval updates map update interval', () => {
		const state = generalReducer(undefined, setMapUpdateInterval(100));
		expect(state.mapUpdateInterval).toBe(100);
	});

	it('setUnitPrefs replaces unit preferences', () => {
		const newPrefs = {
			coordinates: { unit: 'dms', round: 2 },
		};
		const state = generalReducer(undefined, setUnitPrefs(newPrefs));
		expect(state.unitPrefs).toEqual(newPrefs);
	});

	it('initial state has default hardware keys', () => {
		const state = generalReducer(undefined, { type: '@@INIT' });
		expect(state.hardwareKeys).toHaveLength(2);
		expect(state.hardwareKeys[0]).toEqual({
			keyCodeString: 'KEYCODE_VOLUME_UP',
			actionKey: 'zoomIn',
		});
		expect(state.hardwareKeys[1]).toEqual({
			keyCodeString: 'KEYCODE_VOLUME_DOWN',
			actionKey: 'zoomOut',
		});
	});

	it('initial state has default unit prefs', () => {
		const state = generalReducer(undefined, { type: '@@INIT' });
		expect(state.unitPrefs.coordinates).toEqual({ unit: 'dd', round: 4 });
		expect(state.unitPrefs.distance).toEqual({ unit: 'metric', round: 2 });
		expect(state.unitPrefs.speed).toEqual({ unit: 'kmh', round: 2 });
	});

	it('initial state has initialized = false', () => {
		const state = generalReducer(undefined, { type: '@@INIT' });
		expect(state.initialized).toBe(false);
	});
});

// ===========================================================================
// Selectors
// ===========================================================================

describe('general selectors', () => {
	it('selectInitialized returns initialized flag', () => {
		expect(selectInitialized(buildState({ initialized: true }))).toBe(true);
		expect(selectInitialized(buildState({ initialized: false }))).toBe(false);
	});

	it('selectHardwareKeys returns hardware keys', () => {
		const keys = [{ keyCodeString: 'TEST', actionKey: 'test' }];
		expect(selectHardwareKeys(buildState({ hardwareKeys: keys }))).toEqual(keys);
	});

	it('selectUnitPrefs returns unit preferences', () => {
		const prefs = { test: { unit: 'xx', round: 1 } };
		expect(selectUnitPrefs(buildState({ unitPrefs: prefs }))).toEqual(prefs);
	});

	it('selectMapUpdateInterval returns map update interval', () => {
		expect(selectMapUpdateInterval(buildState({ mapUpdateInterval: 60 }))).toBe(60);
	});
});
