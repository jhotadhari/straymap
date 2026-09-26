/**
 * External dependencies
 */
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

/**
 * Internal dependencies
 */
import { SliceSettingsBase } from '../../types';
import { DEFAULT_PROFILE_SETTINGS, ProfileSettings } from './types';

export interface AltitudeProfileState extends SliceSettingsBase {
	/** Per-profile-key settings (routing / line:<id>). */
	profiles: Record<string, ProfileSettings>;
	/** General settings — the fallback for profiles without their own. */
	general: ProfileSettings;
}

const initialState: AltitudeProfileState = {
	initialized: false,
	profiles: {},
	general: DEFAULT_PROFILE_SETTINGS,
};

// Slices contain Redux reducer logic for updating state, and
// generate actions that can be dispatched to trigger those updates.
export const altitudeProfileSlice = createSlice({
	name: 'altitudeProfile',
	initialState,
	reducers: {
		setInitialized: (state, action: PayloadAction<boolean>) => {
			state.initialized = action.payload;
		},
		setProfileSettings: (
			state,
			action: PayloadAction<{ key: string; settings: Partial<ProfileSettings> }>
		) => {
			const { key, settings } = action.payload;
			state.profiles[key] = {
				...(state.profiles[key] ?? DEFAULT_PROFILE_SETTINGS),
				...settings,
			};
		},
		removeProfileSettings: (state, action: PayloadAction<string[]>) => {
			for (const key of action.payload) {
				delete state.profiles[key];
			}
		},
		setGeneralSettings: (state, action: PayloadAction<Partial<ProfileSettings>>) => {
			state.general = {
				...(state.general ?? DEFAULT_PROFILE_SETTINGS),
				...action.payload,
			};
		},
	},
});

// Export the generated action creators for use in components.
export const { setInitialized, setProfileSettings, removeProfileSettings, setGeneralSettings } =
	altitudeProfileSlice.actions;

// Export the slice reducer for use in the store configuration
export default altitudeProfileSlice.reducer;
