/**
 * External dependencies
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
	Animated,
	useAnimatedValue,
	View,
	Pressable,
	Easing,
	StyleSheet,
	LayoutChangeEvent,
} from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import VectorDrawable from '@klarna/react-native-vector-drawable';

/**
 * Internal dependencies
 */
import { randomNumber } from '../lib/utilsLight';

const rotationInterpolateConfig = {
	inputRange: [-360, 360],
	outputRange: ['-360deg', '360deg'],
};

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
	const textOpacity = useAnimatedValue(0);
	const textX = useAnimatedValue(10);
	const textY = useAnimatedValue(10);

	const catScale = useAnimatedValue(1.1);
	const catTranslateY = useAnimatedValue(-5);
	const landRotate = useAnimatedValue(0);
	const waterRotate = useAnimatedValue(0);

	// const textDimsKey = textDims.join('');
	// animate text
	useEffect(() => {
		if (textIsInitialized) {
			// text position
			Animated.timing(textX, {
				toValue: randomNumber(0, size - textDims[0]),
				duration: 150,
				useNativeDriver: true,
			}).start();
			Animated.timing(textY, {
				toValue: randomNumber(0, size - textDims[1]),
				duration: 150,
				useNativeDriver: true,
			}).start();
			// textOpacity
			Animated.sequence([
				Animated.timing(textOpacity, {
					toValue: 1,
					duration: 300,
					useNativeDriver: true,
				}),
				Animated.timing(textOpacity, {
					toValue: 1,
					duration: 400,
					useNativeDriver: true,
				}),
				Animated.timing(textOpacity, {
					toValue: 0,
					duration: 300,
					useNativeDriver: true,
				}),
			]).start();
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
		// water
		Animated.loop(
			Animated.sequence([
				Animated.timing(waterRotate, {
					toValue: 360,
					duration: 2500,
					useNativeDriver: true,
					easing: Easing.linear,
				}),
				Animated.timing(waterRotate, {
					toValue: 0,
					duration: 0,
					useNativeDriver: true,
				}),
			])
		).start();
	}, [waterRotate]);

	useEffect(() => {
		animateLoop && loopAnimate();
	}, [animateLoop, loopAnimate]);

	const onPressAnimate = useCallback(() => {
		// water
		Animated.sequence([
			Animated.timing(waterRotate, {
				toValue: 40,
				duration: 150,
				useNativeDriver: true,
			}),
			Animated.timing(waterRotate, {
				toValue: -40,
				duration: 150,
				useNativeDriver: true,
			}),
			Animated.timing(waterRotate, {
				toValue: 0,
				duration: 150,
				useNativeDriver: true,
			}),
		]).start();
		// land
		Animated.sequence([
			Animated.timing(landRotate, {
				toValue: -20,
				duration: 150,
				useNativeDriver: true,
			}),
			Animated.timing(landRotate, {
				toValue: 15,
				duration: 150,
				useNativeDriver: true,
			}),
			Animated.timing(landRotate, {
				toValue: 0,
				duration: 150,
				useNativeDriver: true,
			}),
		]).start();
		// catScale
		Animated.sequence([
			Animated.timing(catScale, {
				toValue: 1.25,
				duration: 175,
				useNativeDriver: true,
			}),
			Animated.timing(catScale, {
				toValue: 1.1,
				duration: 175,
				useNativeDriver: true,
			}),
		]).start();
		// catTranslateY
		Animated.sequence([
			Animated.timing(catTranslateY, {
				toValue: -15,
				duration: 175,
				useNativeDriver: true,
			}),
			Animated.timing(catTranslateY, {
				toValue: -5,
				duration: 175,
				useNativeDriver: true,
			}),
		]).start();
	}, [
		waterRotate,
		landRotate,
		catScale,
		catTranslateY,
	]);

	const stylePressable = useMemo(() => [styles.pressable, { width: size, height: size }], [size]);

	const styleWaterWrapper = useMemo(
		() => [
			styles.waterLandWrapper,
			{ transform: [{ rotate: waterRotate.interpolate(rotationInterpolateConfig) }] },
		],
		[waterRotate]
	);

	const styleLandWrapper = useMemo(
		() => [
			styles.waterLandWrapper,
			{ transform: [{ rotate: landRotate.interpolate(rotationInterpolateConfig) }] },
		],
		[landRotate]
	);

	const styleDrawableHalf = useMemo(() => ({ width: size * 0.8, height: size * 0.8 }), [size]);

	const styleCatWrapper = useMemo(
		() => [
			styles.catWrapper,
			{
				width: size,
				height: size,
				transform: [{ scale: catScale }, { translateY: catTranslateY }],
			},
		],
		[
			size,
			catScale,
			catTranslateY,
		]
	);

	const styleDrawableFull = useMemo(() => ({ width: size, height: size }), [size]);

	const styleTextWrapper = useMemo(
		() => [
			styles.textWrapper,
			{
				width: size,
				height: size,
				opacity: textOpacity,
				transform: [{ translateX: textX }, { translateY: textY }],
			},
		],
		[
			size,
			textOpacity,
			textX,
			textY,
		]
	);

	const styleText = useMemo(() => [theme.fonts.displayMedium, styles.text], [theme]);

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
			<Animated.View style={styleWaterWrapper}>
				<VectorDrawable
					resourceName="world_map_water"
					style={styleDrawableHalf}
				/>
			</Animated.View>

			<Animated.View style={styleLandWrapper}>
				<VectorDrawable
					resourceName="world_map_land"
					style={styleDrawableHalf}
				/>
			</Animated.View>

			<Animated.View style={styleCatWrapper}>
				<VectorDrawable
					resourceName="ic_launcher_foreground"
					style={styleDrawableFull}
				/>
			</Animated.View>

			{textIsInitialized && (
				<Animated.View style={styleTextWrapper}>
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
