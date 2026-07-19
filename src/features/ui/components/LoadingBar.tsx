/**
 * External dependencies
 */
import { FC, useCallback, useEffect } from 'react';
import { StyleSheet, LayoutChangeEvent } from 'react-native';
import { useTheme } from 'react-native-paper';
import Animated, {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../store/hooks';
import { selectIsBusy } from '../selectors';

const LoadingBar: FC = () => {
	const theme = useTheme();
	const isBusy = useAppSelector(selectIsBusy);

	const barWidthSv = useSharedValue(0);
	const busyProgress = useSharedValue(0);
	const slideAnim = useSharedValue(0);

	useEffect(() => {
		busyProgress.value = withTiming(isBusy ? 1 : 0, { duration: 400 });
	}, [isBusy, busyProgress]);

	useEffect(() => {
		if (isBusy) {
			slideAnim.value = 0;
			slideAnim.value = withRepeat(
				withTiming(1, { duration: 1500, easing: Easing.linear }),
				-1,
				false
			);
		}
	}, [isBusy, slideAnim]);

	const handleLayout = useCallback(
		(e: LayoutChangeEvent) => {
			barWidthSv.value = e.nativeEvent.layout.width;
		},
		[barWidthSv]
	);

	const wrapperStyle = useAnimatedStyle(() => ({
		opacity: busyProgress.value,
	}));

	const chunkStyle = useAnimatedStyle(() => {
		const chunkWidth = barWidthSv.value * 0.55;
		const travelDist = barWidthSv.value + chunkWidth;
		const offset = -chunkWidth + slideAnim.value * travelDist;
		const pulse = Math.sin(slideAnim.value * Math.PI);
		return {
			width: chunkWidth,
			transform: [{ translateX: offset }],
			opacity: 0.3 + 0.7 * pulse,
		};
	});

	const surfaceColor = theme.colors.surface;

	return (
		<Animated.View
			style={[styles.barWrapper, wrapperStyle]}
			onLayout={handleLayout}
		>
			<Animated.View
				style={[
					styles.barChunk,
					{ backgroundColor: theme.colors.primary },
					chunkStyle,
				]}
			>
				<Svg style={styles.svgOverlay}>
					<Defs>
						<LinearGradient
							id="fadeEdges"
							x1="0"
							y1="0"
							x2="1"
							y2="0"
						>
							<Stop
								offset="0"
								stopColor={surfaceColor}
								stopOpacity="1"
							/>
							<Stop
								offset="0.2"
								stopColor={surfaceColor}
								stopOpacity="0"
							/>
							<Stop
								offset="0.8"
								stopColor={surfaceColor}
								stopOpacity="0"
							/>
							<Stop
								offset="1"
								stopColor={surfaceColor}
								stopOpacity="1"
							/>
						</LinearGradient>
					</Defs>
					<Rect
						x="0"
						y="0"
						width="100%"
						height="100%"
						fill="url(#fadeEdges)"
					/>
				</Svg>
			</Animated.View>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	barWrapper: {
		height: 4,
		overflow: 'hidden',
		position: 'absolute',
		bottom: 0,
		zIndex: 999,
		width: '100%',
	},
	barChunk: {
		position: 'absolute',
		top: 0,
		height: '100%',
		overflow: 'hidden',
	},
	svgOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		width: '100%',
		height: '100%',
	},
});

export default LoadingBar;
