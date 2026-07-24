/**
 * External dependencies
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Pressable, StyleSheet, LayoutChangeEvent } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import VectorDrawable from '@klarna/react-native-vector-drawable';
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withTiming,
	withSequence,
	withRepeat,
	Easing,
} from 'react-native-reanimated';

/**
 * Internal dependencies
 */
import { randomNumber } from '../lib/utilsLight';

const strings = [
	'Love Bicycles',
	'Love Geography',
	'Love Antifa',
	'Love Diversity',
	'Love Equality',
	'Fuck Nazis',
	'Fuck Capitalism',
	'Fuck Fascism',
	'Fuck Xenophobia',
	'Fuck Borders',
	'Fuck Racism',
	'Fuck Flatearthlers',
];

const AnimatedLogo = ({
	size,
	shouldShit,
	animateOnPress,
	animateLoop,
}: {
	size: number;
	shouldShit?: boolean;
	animateOnPress?: boolean;
	animateLoop?: boolean;
}) => {
	const theme = useTheme();

	const [stringIndex, setStringIndex] = useState(0);
	const [stringIndexUsed, setStringIndexUsed] = useState<number[]>([]);
	const [textIsInitialized, setTextIsInitialized] = useState(false);

	const getNewStringIndex = useCallback((): number => {
		const stringsAvailable = [...strings].filter(
			(string, index) => !stringIndexUsed.includes(index)
		);
		if (!stringsAvailable.length) {
			return -1;
		}
		const stringIndexAvailable = Math.round(randomNumber(0, stringsAvailable.length - 1));
		const newStringIndex = strings.findIndex(
			(string) => string === stringsAvailable[stringIndexAvailable]
		);
		return !textIsInitialized || newStringIndex !== stringIndex || stringsAvailable.length <= 1
			? newStringIndex
			: getNewStringIndex();
	}, [
		stringIndexUsed,
		textIsInitialized,
		stringIndex,
	]);

	useEffect(() => {
		if (textIsInitialized) {
			const maybeNewVal = [...stringIndexUsed, stringIndex];
			setStringIndexUsed(maybeNewVal.length === strings.length ? [] : maybeNewVal);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [stringIndex]);

	const [textDims, setTextDims] = useState([0, 0]);

	const textOpacity = useSharedValue(0);
	const textX = useSharedValue(10);
	const textY = useSharedValue(10);

	const catScale = useSharedValue(1.1);
	const catTranslateY = useSharedValue(-5);
	const landRotate = useSharedValue(0);
	const waterRotate = useSharedValue(0);

	// Animate text
	useEffect(() => {
		if (textIsInitialized) {
			textX.value = withTiming(randomNumber(0, size - textDims[0]), { duration: 150 });
			textY.value = withTiming(randomNumber(0, size - textDims[1]), { duration: 150 });
			textOpacity.value = withSequence(
				withTiming(1, { duration: 300 }),
				withTiming(1, { duration: 400 }),
				withTiming(0, { duration: 300 })
			);
		}
	}, [
		textDims,
		size,
		textIsInitialized,
		textOpacity,
		textX,
		textY,
	]);

	const loopAnimate = useCallback(() => {
		waterRotate.value = withRepeat(
			withSequence(
				withTiming(360, { duration: 2500, easing: Easing.linear }),
				withTiming(0, { duration: 0 })
			),
			-1
		);
	}, [waterRotate]);

	useEffect(() => {
		animateLoop && loopAnimate();
	}, [animateLoop, loopAnimate]);

	const onPressAnimate = useCallback(() => {
		waterRotate.value = withSequence(
			withTiming(40, { duration: 150 }),
			withTiming(-40, { duration: 150 }),
			withTiming(0, { duration: 150 })
		);
		landRotate.value = withSequence(
			withTiming(-20, { duration: 150 }),
			withTiming(15, { duration: 150 }),
			withTiming(0, { duration: 150 })
		);
		catScale.value = withSequence(
			withTiming(1.25, { duration: 175 }),
			withTiming(1.1, { duration: 175 })
		);
		catTranslateY.value = withSequence(
			withTiming(-15, { duration: 175 }),
			withTiming(-5, { duration: 175 })
		);
	}, [
		waterRotate,
		landRotate,
		catScale,
		catTranslateY,
	]);

	const styleWaterWrapper = useAnimatedStyle(() => ({
		transform: [{ rotate: `${waterRotate.value}deg` }],
	}));

	const styleLandWrapper = useAnimatedStyle(() => ({
		transform: [{ rotate: `${landRotate.value}deg` }],
	}));

	const styleCatWrapper = useAnimatedStyle(() => ({
		transform: [{ scale: catScale.value }, { translateY: catTranslateY.value }],
	}));

	const styleTextWrapper = useAnimatedStyle(() => ({
		opacity: textOpacity.value,
		transform: [{ translateX: textX.value }, { translateY: textY.value }],
	}));

	const stylePressable = useMemo(() => [styles.pressable, { width: size, height: size }], [size]);

	const styleDrawableHalf = useMemo(() => ({ width: size * 0.8, height: size * 0.8 }), [size]);

	const styleDrawableFull = useMemo(() => ({ width: size, height: size }), [size]);

	const styleText = useMemo(() => [theme.fonts.displayMedium, styles.text], [theme]);
	const styleSize = useMemo(() => ({ width: size, height: size }), [size]);
	const styleWater = useMemo(
		() => [styles.waterLandWrapper, styleWaterWrapper],
		[styleWaterWrapper]
	);
	const styleLand = useMemo(
		() => [styles.waterLandWrapper, styleLandWrapper],
		[styleLandWrapper]
	);
	const styleCat = useMemo(
		() => [
			styles.catWrapper,
			styleSize,
			styleCatWrapper,
		],
		[styleSize, styleCatWrapper]
	);
	const styleTextWrap = useMemo(
		() => [
			styles.textWrapper,
			styleSize,
			styleTextWrapper,
		],
		[styleSize, styleTextWrapper]
	);

	const handlePress = useCallback(() => {
		if (shouldShit) {
			setTextIsInitialized(true);
			setStringIndex(getNewStringIndex());
		}
		animateOnPress && onPressAnimate();
	}, [
		shouldShit,
		animateOnPress,
		getNewStringIndex,
		onPressAnimate,
	]);

	const handleLayout = useCallback(
		(e: LayoutChangeEvent) =>
			setTextDims([e.nativeEvent.layout.width, e.nativeEvent.layout.height]),
		[]
	);

	return (
		<Pressable
			style={stylePressable}
			onPress={handlePress}
		>
			<Animated.View style={styleWater}>
				<VectorDrawable
					resourceName="world_map_water"
					style={styleDrawableHalf}
				/>
			</Animated.View>

			<Animated.View style={styleLand}>
				<VectorDrawable
					resourceName="world_map_land"
					style={styleDrawableHalf}
				/>
			</Animated.View>

			<Animated.View style={styleCat}>
				<VectorDrawable
					resourceName="ic_launcher_foreground"
					style={styleDrawableFull}
				/>
			</Animated.View>

			{textIsInitialized && (
				<Animated.View style={styleTextWrap}>
					<View
						onLayout={handleLayout}
						style={styles.textInner}
					>
						<Text style={styleText}>{strings[stringIndex]}</Text>
					</View>
				</Animated.View>
			)}
		</Pressable>
	);
};

const styles = StyleSheet.create({
	pressable: {
		justifyContent: 'center',
		alignItems: 'center',
	},
	waterLandWrapper: {
		position: 'absolute',
		justifyContent: 'center',
		alignItems: 'center',
	},
	catWrapper: {
		position: 'absolute',
	},
	textWrapper: {
		position: 'absolute',
		alignItems: 'flex-start',
		top: 0,
		left: 0,
	},
	textInner: {
		padding: 10,
	},
	text: {
		fontFamily: 'jangly_walk',
		textShadowColor: '#000',
		textShadowOffset: { width: 5, height: 5 },
		textShadowRadius: 10,
		color: '#fff',
	},
});

export default AnimatedLogo;
