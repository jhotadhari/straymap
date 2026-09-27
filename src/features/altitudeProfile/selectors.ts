/**
 * Internal dependencies
 */
import { omit, pick } from 'lodash-es';
import createAppSelector from '../../store/createAppSelector';
import { RootState } from '../../store/store';
import { DEFAULT_PROFILE_SETTINGS, ProfileSettings } from './types';

/**
 * Settings keys that are always per-profile ("custom") — the general
 * settings never contribute these to a profile's effective settings.
 */
export const PER_PROFILE_SETTINGS_KEYS = [
	'ratioValue',
	'followMap',
] as const;

export const selectInitialized = (state: RootState) => state.altitudeProfile.initialized;

export const selectGeneralSettings = createAppSelector(
	(state: RootState) => state.altitudeProfile.general,
	(general): ProfileSettings => ({
		...DEFAULT_PROFILE_SETTINGS,
		...general,
	})
);

export const selectHasOwnProfileSettings = (state: RootState, key: string | undefined): boolean => {
	if (!key) {
		return false;
	}
	const own = state.altitudeProfile.profiles[key];
	if (!own) {
		return false;
	}
	// Per-profile-only entries (ratio / follow-map) don't count as "custom"
	// — the Default/Custom mode governs everything except those.
	return Object.keys(omit(own, PER_PROFILE_SETTINGS_KEYS)).length > 0;
};

export const selectProfileSettings = createAppSelector(
	(state: RootState) => state.altitudeProfile.general,
	(state: RootState) => state.altitudeProfile.profiles,
	(_state: RootState, key: string | undefined) => key,
	(general, profiles, key): ProfileSettings => ({
		...DEFAULT_PROFILE_SETTINGS,
		...omit(general, PER_PROFILE_SETTINGS_KEYS),
		...(key ? (profiles[key] ?? {}) : {}),
	})
);

/** The profile's own per-profile settings (always custom). */
export const selectOwnPerProfileSettings = (
	state: RootState,
	key: string | undefined
): Partial<Pick<ProfileSettings, 'ratioValue' | 'followMap'>> =>
	key ? pick(state.altitudeProfile.profiles[key] ?? {}, PER_PROFILE_SETTINGS_KEYS) : {};
