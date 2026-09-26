/**
 * Internal dependencies
 */
import createAppSelector from '../../store/createAppSelector';
import { RootState } from '../../store/store';
import { DEFAULT_PROFILE_SETTINGS, ProfileSettings } from './types';

export const selectInitialized = (state: RootState) => state.altitudeProfile.initialized;

export const selectGeneralSettings = createAppSelector(
	(state: RootState) => state.altitudeProfile.general,
	(general): ProfileSettings => ({
		...DEFAULT_PROFILE_SETTINGS,
		...general,
	})
);

export const selectHasOwnProfileSettings = (state: RootState, key: string | undefined): boolean =>
	!!key && !!state.altitudeProfile.profiles[key];

export const selectProfileSettings = createAppSelector(
	(state: RootState) => state.altitudeProfile.general,
	(state: RootState) => state.altitudeProfile.profiles,
	(_state: RootState, key: string | undefined) => key,
	(general, profiles, key): ProfileSettings => ({
		...DEFAULT_PROFILE_SETTINGS,
		...general,
		...(key ? (profiles[key] ?? {}) : {}),
	})
);
