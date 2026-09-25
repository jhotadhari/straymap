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
} from '../slice';
import { selectProfileSettings } from '../selectors';
import { DEFAULT_PROFILE_SETTINGS } from '../types';
import type { RootState } from '../../../store/store';

const buildRoot = (state?: Partial<{ profiles: Record<string, object> }>) =>
	({
		altitudeProfile: {
			initialized: false,
			profiles: {},
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
});
