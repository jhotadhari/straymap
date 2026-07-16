/**
 * External dependencies
 */
import { FC, useMemo } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { useTheme, ActivityIndicator } from 'react-native-paper';

const LoadingIndicator: FC<{
	style?: ViewStyle;
	size?: number | 'small' | 'large' | undefined;
}> = ({ style, size }) => {
	const theme = useTheme();

	const styleIndicator = useMemo(
		() => [
			styles.base,
			{ borderRadius: theme.roundness },
			style,
		],
		[theme, style]
	);

	return (
		<ActivityIndicator
			animating={true}
			size={size}
			style={styleIndicator}
			color={theme.colors.primary}
		/>
	);
};

const styles = StyleSheet.create({
	base: { backgroundColor: 'transparent' },
});

export default LoadingIndicator;
