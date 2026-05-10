/**
 * External dependencies
 */
import { useColorScheme } from 'react-native';
import { useMemo } from 'react';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../hooks';
import { selectTheme } from './selectors';
import customThemes from '../../../themes';

export const useSetupTheme = () => {
	const systemIsDarkMode = useColorScheme() === 'dark';

	const selectedTheme = useAppSelector(selectTheme);

	// Select theme by key from customThemes. Fallback to system.
	const theme = useMemo(() => {
		const option = Object.keys(customThemes).includes(selectedTheme) ? selectedTheme : 'system';
		return 'system' === option
			? customThemes[systemIsDarkMode ? 'dark' : 'light']
			: customThemes[option];
	}, [
		selectedTheme,
		systemIsDarkMode,
	]);

	return theme;
};
