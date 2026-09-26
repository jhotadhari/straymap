/**
 * External dependencies
 */
import { createContext } from 'react';

/**
 * Internal dependencies
 */
import { DEFAULT_PROFILE_SETTINGS, ProfileSettings } from '../../types';

export type ProfileSettingsModalContextType = {
	profileKey: string;
	settings: ProfileSettings;
	update: (partial: Partial<ProfileSettings>) => void;
	onDismiss: () => void;
};

export const ProfileSettingsModalContext = createContext<ProfileSettingsModalContextType>({
	profileKey: '',
	settings: DEFAULT_PROFILE_SETTINGS,
	update: (_partial: Partial<ProfileSettings>) => undefined,
	onDismiss: () => undefined,
});
