/**
 * Tests for altitudeProfile slice reducers and selectors.
 */

/**
 * Internal dependencies
 */
import altitudeProfileReducer, {
	setInitialized,
	setProfileSettings,
	removeProfileSettings,
	setGeneralSettings,
} from '../slice';
import {
	selectGeneralSettings,
	selectHasOwnProfileSettings,
	selectProfileSettings,
} from '../selectors';
import { DEFAULT_PROFILE_SETTINGS } from '../types';
import type { RootState } from '../../../store/store';

const buildRoot = (state?: Partial<{ profiles: Record<string, object>; general: object }>) =>
	({
		altitudeProfile: {
			initialized: false,
			profiles: {},
			general: DEFAULT_PROFILE_SETTINGS,
			...state,
		},
	}) as unknown as RootState;

describe('altitudeProfile slice reducers', () => {
	it('setInitialized', () => {
		const state = altitudeProfileReducer(undefined, setInitialized(true));
		expect(state.initialized).toBe(true);
	});

	it('setProfileSettings merges partial settings', () => {
		let state = altitudeProfileReducer(
			undefined,
			setProfileSettings({ key: 'routing', settings: { secondary: 'slope' } })
		);
		expect(state.profiles['routing']).toEqual({
			...DEFAULT_PROFILE_SETTINGS,
			secondary: 'slope',
		});
		state = altitudeProfileReducer(
			state,
			setProfileSettings({ key: 'routing', settings: { colorMode: 'slope' } })
		);
		expect(state.profiles['routing']).toEqual({
			...DEFAULT_PROFILE_SETTINGS,
			secondary: 'slope',
			colorMode: 'slope',
		});
	});

	it('removeProfileSettings deletes keys', () => {
		let state = altitudeProfileReducer(
			undefined,
			setProfileSettings({ key: 'line:1', settings: { secondary: 'slope' } })
		);
		state = altitudeProfileReducer(undefined, {
			type: 'altitudeProfile/setProfileSettings',
			payload: { key: 'line:2', settings: {} },
		} as any);
		state = altitudeProfileReducer(state, removeProfileSettings(['line:1']));
		expect(state.profiles['line:1']).toBeUndefined();
	});

	it('setGeneralSettings merges partial settings', () => {
		const state = altitudeProfileReducer(undefined, setGeneralSettings({ colorMode: 'slope' }));
		expect(state.general).toEqual({
			...DEFAULT_PROFILE_SETTINGS,
			colorMode: 'slope',
		});
	});
});

describe('altitudeProfile selectors', () => {
	it('selectProfileSettings returns defaults for unknown keys', () => {
		expect(selectProfileSettings(buildRoot(), 'routing')).toEqual(DEFAULT_PROFILE_SETTINGS);
	});

	it('selectProfileSettings returns stored settings', () => {
		const state = altitudeProfileReducer(
			undefined,
			setProfileSettings({ key: 'line:3', settings: { colorMode: 'slope' } })
		);
		const root = { altitudeProfile: state } as unknown as RootState;
		expect(selectProfileSettings(root, 'line:3').colorMode).toBe('slope');
	});

	it('selectProfileSettings merges defaults for partial stored settings', () => {
		// Simulates older persisted settings restored without the new keys.
		const root = {
			altitudeProfile: {
				initialized: true,
				general: DEFAULT_PROFILE_SETTINGS,
				profiles: { 'line:4': { colorMode: 'slope' } },
			},
		} as unknown as RootState;
		const settings = selectProfileSettings(root, 'line:4');
		expect(settings.colorMode).toBe('slope');
		expect(settings.primary).toBe('elevation');
		expect(settings.showLabel).toBe(true);
		expect(settings.showStats).toBe(true);
	});

	it('selectProfileSettings falls back to the general settings', () => {
		const root = buildRoot({
			general: { ...DEFAULT_PROFILE_SETTINGS, colorMode: 'slope' },
		});
		expect(selectProfileSettings(root, 'line:5').colorMode).toBe('slope');
		expect(selectProfileSettings(root, 'line:5').secondary).toBe('none');
	});

	it('selectProfileSettings prefers own settings over the general settings', () => {
		const root = buildRoot({
			general: { ...DEFAULT_PROFILE_SETTINGS, colorMode: 'slope' },
			profiles: { 'line:6': { colorMode: 'axis' } },
		});
		expect(selectProfileSettings(root, 'line:6').colorMode).toBe('axis');
	});

	it('selectGeneralSettings merges defaults', () => {
		expect(selectGeneralSettings(buildRoot())).toEqual(DEFAULT_PROFILE_SETTINGS);
		const root = buildRoot({
			general: { ...DEFAULT_PROFILE_SETTINGS, showStats: false },
		});
		expect(selectGeneralSettings(root).showStats).toBe(false);
	});

	it('selectHasOwnProfileSettings detects own entries', () => {
		const root = buildRoot({
			profiles: { 'line:7': { colorMode: 'slope' } },
		});
		expect(selectHasOwnProfileSettings(root, 'line:7')).toBe(true);
		expect(selectHasOwnProfileSettings(root, 'line:8')).toBe(false);
		expect(selectHasOwnProfileSettings(root, undefined)).toBe(false);
	});
});
