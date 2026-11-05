/**
 * External dependencies
 */
import React, { FC, useEffect } from 'react';
import MaterialIcons from '@react-native-vector-icons/material-icons/static';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

/**
 * Internal dependencies
 */
import { DashboardWidget } from '../../../dashboard/types';
import Display, { Options } from './Display';
import Control from './Control';

const Icon: FC<{ color: string; size: number; rotation?: number }> = ({
	color,
	size,
	rotation,
}) => {
	const rotationSv = useSharedValue(rotation ?? 0);

	useEffect(() => {
		if (rotation === undefined) {
			return;
		}
		// Shortest-path rotation, so 359° → 1° turns +2° instead of −358°.
		const delta = ((rotation - rotationSv.value + 540) % 360) - 180;
		rotationSv.value = withTiming(rotationSv.value + delta, { duration: 120 });
	}, [rotation, rotationSv]);

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

export default {
	key: 'gnssCompass',
	label: 'gnss.gnssCompass',
	Display,
	Control,
	Icon,
	defaultMinWidth: 80,
} as DashboardWidget<Options>;
