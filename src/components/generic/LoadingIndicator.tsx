/**
 * External dependencies
 */
import { FC } from 'react';
import { ViewStyle } from 'react-native';
import { useTheme, ActivityIndicator } from 'react-native-paper';

const LoadingIndicator: FC<{
	style?: ViewStyle;
	size?: number | 'small' | 'large' | undefined;
}> = ({ style, size }) => {
	const theme = useTheme();
	return (
		<ActivityIndicator
			animating={true}
			size={size}
			style={{
				backgroundColor: 'transparent',
				borderRadius: theme.roundness,
				...style,
			}}
			color={theme.colors.primary}
		/>
	);
};

export default LoadingIndicator;
