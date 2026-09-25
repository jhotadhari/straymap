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
}

const initialState: AltitudeProfileState = {
	initialized: false,
	profiles: {},
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
	},
});

// Export the generated action creators for use in components.
export const { setInitialized, setProfileSettings, removeProfileSettings } =
	altitudeProfileSlice.actions;

// Export the slice reducer for use in the store configuration
export default altitudeProfileSlice.reducer;
