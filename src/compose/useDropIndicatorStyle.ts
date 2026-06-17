import { useMemo } from 'react';
import { useTheme } from 'react-native-paper';

const useDropIndicatorStyle = () => {
	const theme = useTheme();
	const dropIndicatorStyle = useMemo(
		() => ({
			backgroundColor: theme.colors.primaryContainer,
			borderColor: theme.colors.primary,
			borderWidth: 1,
			opacity: 0.5,
			borderRadius: theme.roundness,
		}),
		[theme]
	);
	return dropIndicatorStyle;
};
export default useDropIndicatorStyle;
