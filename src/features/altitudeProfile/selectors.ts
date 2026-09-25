/**
 * Internal dependencies
 */
import { RootState } from '../../store/store';
import { DEFAULT_PROFILE_SETTINGS, ProfileSettings } from './types';

export const selectInitialized = (state: RootState) => state.altitudeProfile.initialized;

export const selectProfileSettings = (
	state: RootState,
	key: string | undefined
): ProfileSettings =>
	key
		? (state.altitudeProfile.profiles[key] ?? DEFAULT_PROFILE_SETTINGS)
		: DEFAULT_PROFILE_SETTINGS;
