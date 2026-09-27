/**
 * External dependencies
 */
import { createContext } from 'react';

/**
 * Internal dependencies
 */
import { DEFAULT_PROFILE_SETTINGS, ProfileSettings } from '../../types';

export type ProfileSettingsMode = 'general' | 'own';

export type ProfileSettingsModalContextType = {
	profileKey: string;
	settings: ProfileSettings;
	update: (partial: Partial<ProfileSettings>) => void;
	onDismiss: () => void;
	mode: ProfileSettingsMode;
	setMode: (mode: ProfileSettingsMode) => void;
	currentRatio?: number;
	fitRatio?: number;
	onFitScreen?: () => void;
};

export const ProfileSettingsModalContext = createContext<ProfileSettingsModalContextType>({
	profileKey: '',
	settings: DEFAULT_PROFILE_SETTINGS,
	update: (_partial: Partial<ProfileSettings>) => undefined,
	onDismiss: () => undefined,
	mode: 'general',
	setMode: (_mode: ProfileSettingsMode) => undefined,
	currentRatio: undefined,
	fitRatio: undefined,
	onFitScreen: undefined,
});
