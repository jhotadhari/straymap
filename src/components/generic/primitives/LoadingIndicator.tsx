/**
 * External dependencies
 */
import { FC, useEffect, useMemo } from 'react';

import { useTheme } from 'react-native-paper';
import Animated, {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withTiming,
} from 'react-native-reanimated';

const LoadingIndicator: FC<{
	style?: Parameters<typeof Animated.View>[0]['style'];
	size?: number | 'small' | 'large' | undefined;
}> = ({ style, size }) => {
	const theme = useTheme();

	const rotation = useSharedValue(0);

	useEffect(() => {
		rotation.value = withRepeat(
			withTiming(360, { duration: 1000, easing: Easing.linear }),
			-1,
			false
		);
	}, [rotation]);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ rotate: `${rotation.value}deg` }],
	}));

	const dimension = typeof size === 'number' ? size : size === 'large' ? 48 : 24;
	const borderWidth = dimension / 10;

	const ringStyle = useMemo(
		() => ({
			width: dimension,
			height: dimension,
			borderRadius: dimension / 2,
			borderWidth,
			borderColor: 'transparent' as const,
			borderTopColor: theme.colors.primary,
		}),
		[dimension, borderWidth, theme.colors.primary]
	);

	return (
		<Animated.View
			style={[
				animatedStyle,
				ringStyle,
				style,
			]}
		/>
	);
};

export default LoadingIndicator;
