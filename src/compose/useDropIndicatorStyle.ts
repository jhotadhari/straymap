/**
 * External dependencies
 */
import { useMemo } from 'react';
import { useTheme } from 'react-native-paper';

/**
 * Internal dependencies
 */
import { OPACITY_DISABLED } from '../constants';

const useDropIndicatorStyle = () => {
	const theme = useTheme();
	const dropIndicatorStyle = useMemo(
		() => ({
			backgroundColor: theme.colors.primaryContainer,
			borderColor: theme.colors.primary,
			borderWidth: 1,
			opacity: OPACITY_DISABLED,
			borderRadius: theme.roundness,
		}),
		[theme]
	);
	return dropIndicatorStyle;
};
export default useDropIndicatorStyle;
