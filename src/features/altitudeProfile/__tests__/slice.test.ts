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
	resetProfileSettingsToPerProfile,
	setGeneralSettings,
} from '../slice';
import {
	selectGeneralSettings,
	selectHasOwnProfileSettings,
	selectOwnPerProfileSettings,
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
			setProfileSettings({ key: 'routing', settings: { primaryColor: 'secondary' } })
		);
		expect(state.profiles['routing']).toEqual({
			...DEFAULT_PROFILE_SETTINGS,
			secondary: 'slope',
			primaryColor: 'secondary',
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
		const state = altitudeProfileReducer(
			undefined,
			setGeneralSettings({ primaryColor: 'secondary' })
		);
		expect(state.general).toEqual({
			...DEFAULT_PROFILE_SETTINGS,
			primaryColor: 'secondary',
		});
	});

	it('resetProfileSettingsToPerProfile keeps only the per-profile props', () => {
		let state = altitudeProfileReducer(
			undefined,
			setProfileSettings({
				key: 'line:1',
				settings: { primaryColor: 'secondary', ratioValue: 20, followMap: true },
			})
		);
		state = altitudeProfileReducer(state, resetProfileSettingsToPerProfile('line:1'));
		expect(state.profiles['line:1']).toEqual({ ratioValue: 20, followMap: true });
	});

	it('resetProfileSettingsToPerProfile drops non-per-profile props of a merged entry', () => {
		// setProfileSettings merges over the defaults — only the
		// non-per-profile props go (the default followMap false is kept
		// only when the entry carries it; here the merge keeps it, so the
		// entry retains followMap: false as a stored per-profile value).
		let state = altitudeProfileReducer(
			undefined,
			setProfileSettings({ key: 'line:2', settings: { primaryColor: 'secondary' } })
		);
		state = altitudeProfileReducer(state, resetProfileSettingsToPerProfile('line:2'));
		expect(state.profiles['line:2']).toEqual({ followMap: false });
		expect(
			selectHasOwnProfileSettings(
				{ altitudeProfile: state } as unknown as RootState,
				'line:2'
			)
		).toBe(false);
	});
});

describe('altitudeProfile selectors', () => {
	it('selectProfileSettings returns defaults for unknown keys', () => {
		expect(selectProfileSettings(buildRoot(), 'routing')).toEqual(DEFAULT_PROFILE_SETTINGS);
	});

	it('selectProfileSettings returns stored settings', () => {
		const state = altitudeProfileReducer(
			undefined,
			setProfileSettings({ key: 'line:3', settings: { primaryColor: 'secondary' } })
		);
		const root = { altitudeProfile: state } as unknown as RootState;
		expect(selectProfileSettings(root, 'line:3').primaryColor).toBe('secondary');
	});

	it('selectProfileSettings merges defaults for partial stored settings', () => {
		// Simulates older persisted settings restored without the new keys.
		const root = {
			altitudeProfile: {
				initialized: true,
				general: DEFAULT_PROFILE_SETTINGS,
				profiles: { 'line:4': { primaryColor: 'secondary' } },
			},
		} as unknown as RootState;
		const settings = selectProfileSettings(root, 'line:4');
		expect(settings.primaryColor).toBe('secondary');
		expect(settings.primary).toBe('elevation');
		expect(settings.ratioValue).toBeUndefined();
		expect(settings.followMap).toBe(false);
		expect(settings.showLabel).toBe(true);
		expect(settings.showStats).toBe(true);
		expect(settings.blendColors).toBe(false);
	});

	it('selectProfileSettings ignores the removed colorMode key', () => {
		// Old persisted profiles carried a `colorMode` key — it must not
		// leak into the new model; the defaults apply instead.
		const root = {
			altitudeProfile: {
				initialized: true,
				general: DEFAULT_PROFILE_SETTINGS,
				profiles: { 'line:4': { colorMode: 'slope' } as object },
			},
		} as unknown as RootState;
		const settings = selectProfileSettings(root, 'line:4');
		expect(settings.primaryColor).toBe('axis');
		expect(settings.secondaryColor).toBe('axis');
	});

	it('selectProfileSettings falls back to the general settings', () => {
		const root = buildRoot({
			general: { ...DEFAULT_PROFILE_SETTINGS, primaryColor: 'secondary' },
		});
		expect(selectProfileSettings(root, 'line:5').primaryColor).toBe('secondary');
		expect(selectProfileSettings(root, 'line:5').secondary).toBe('none');
	});

	it('selectProfileSettings prefers own settings over the general settings', () => {
		const root = buildRoot({
			general: { ...DEFAULT_PROFILE_SETTINGS, primaryColor: 'secondary' },
			profiles: { 'line:6': { primaryColor: 'axis' } },
		});
		expect(selectProfileSettings(root, 'line:6').primaryColor).toBe('axis');
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
			profiles: { 'line:7': { primaryColor: 'secondary' } },
		});
		expect(selectHasOwnProfileSettings(root, 'line:7')).toBe(true);
		expect(selectHasOwnProfileSettings(root, 'line:8')).toBe(false);
		expect(selectHasOwnProfileSettings(root, undefined)).toBe(false);
	});

	it('selectHasOwnProfileSettings ignores per-profile-only entries', () => {
		const root = buildRoot({
			profiles: {
				'line:9': { ratioValue: 20, followMap: true },
			},
		});
		expect(selectHasOwnProfileSettings(root, 'line:9')).toBe(false);
	});

	it('selectProfileSettings ignores the general per-profile settings', () => {
		const root = buildRoot({
			general: { ...DEFAULT_PROFILE_SETTINGS, ratioValue: 20, followMap: true },
		});
		const settings = selectProfileSettings(root, 'line:10');
		expect(settings.ratioValue).toBeUndefined();
		expect(settings.followMap).toBe(false);
	});

	it('selectProfileSettings uses the own per-profile settings independently per profile', () => {
		const root = buildRoot({
			profiles: {
				'line:11': { ratioValue: 20 },
				'line:12': { ratioValue: 30, followMap: true },
			},
		});
		expect(selectProfileSettings(root, 'line:11').ratioValue).toBe(20);
		expect(selectProfileSettings(root, 'line:11').followMap).toBe(false);
		expect(selectProfileSettings(root, 'line:12').ratioValue).toBe(30);
		expect(selectProfileSettings(root, 'line:12').followMap).toBe(true);
		expect(selectProfileSettings(root, 'line:13').ratioValue).toBeUndefined();
		expect(selectProfileSettings(root, 'line:13').followMap).toBe(false);
	});

	it('selectOwnPerProfileSettings returns only the own per-profile props', () => {
		const root = buildRoot({
			profiles: {
				'line:14': { primaryColor: 'slope', ratioValue: 25, followMap: true },
			},
		});
		expect(selectOwnPerProfileSettings(root, 'line:14')).toEqual({
			ratioValue: 25,
			followMap: true,
		});
		expect(selectOwnPerProfileSettings(root, 'line:15')).toEqual({});
	});
});
