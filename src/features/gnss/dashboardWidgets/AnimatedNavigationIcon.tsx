/**
 * External dependencies
 */
import React, { FC, useEffect } from 'react';
import MaterialIcons from '@react-native-vector-icons/material-icons/static';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

/**
 * Internal dependencies
 */

/**
 * The north-up navigation arrow shared by the compass and course
 * dashboard widgets. When the framework passes a `rotation`, the arrow
 * eases to it on the shortest path (so 359° → 1° turns +2° instead of
 * −358°); without one it stays static north-up.
 */
const AnimatedNavigationIcon: FC<{
	color: string;
	size: number;
	rotation?: number;
}> = ({ color, size, rotation }) => {
	const rotationSv = useSharedValue(rotation ?? 0);

	useEffect(() => {
		if (rotation === undefined) {
			return;
		}
		const delta = ((rotation - rotationSv.value + 540) % 360) - 180;
		rotationSv.value = withTiming(rotationSv.value + delta, { duration: 120 });
	}, [
		rotation,
		rotationSv,
	]);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ rotate: `${rotationSv.value}deg` }],
	}));

	return (
		<Animated.View style={animatedStyle}>
			<MaterialIcons
				color={color}
				size={size}
				name="navigation"
			/>
		</Animated.View>
	);
};

export default AnimatedNavigationIcon;
