/**
 * External dependencies
 */
import { useCallback, useMemo, useState } from 'react';
import { SharedValue, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Gesture } from 'react-native-gesture-handler';
import { clamp, isNumber } from 'lodash-es';
import { Dimensions } from 'react-native';

/**
 * Internal dependencies
 */
import { DrawerState } from '../types';
import { getDrawerWidthResponsive } from '../utils';

const useDrawerState = ({
	side,
	translationX,
	translationXOther,
}: {
	side: string;
	translationX: SharedValue<number>;
	translationXOther: SharedValue<number>;
}): DrawerState => {
	const { width } = Dimensions.get('window');

	const drawerWidthResponsive = getDrawerWidthResponsive(width);

	const prevTranslationX = useSharedValue(
		'left' === side ? -drawerWidthResponsive : drawerWidthResponsive
	);

	const [showContent, setShowContent] = useState(false);

	const animatedStyles = useAnimatedStyle(() => ({
		transform: [{ translateX: translationX.value }],
	}));

	const setTranslationX = useCallback(
		(newVal: number) => {
			translationX.value = newVal;
			// Render inner on initial open.
			if (!showContent) {
				setShowContent(true);
			}
			// Maybe shrink other
			const remaining =
				'left' === side
					? width - newVal - drawerWidthResponsive
					: width + newVal - drawerWidthResponsive;
			const remainingOther =
				'left' === side
					? width + translationXOther.value - drawerWidthResponsive
					: width - translationXOther.value - drawerWidthResponsive;
			if (remaining - (width - remainingOther) < width / 3) {
				translationXOther.value = clamp(
					'right' === side ? newVal - (width * 2) / 3 : newVal + (width * 2) / 3,
					'right' === side ? -drawerWidthResponsive : 0,
					'right' === side ? 0 : drawerWidthResponsive
				);
			}
		},
		[
			side,
			drawerWidthResponsive,
			width,
			translationX,
			translationXOther,
			showContent,
		]
	);

	const expand = useCallback(
		(
			expanded:
				| number // fraction between 0 and 1
				| boolean
		) => {
			const newTranslationX = expanded
				? 'left' === side
					? isNumber(expanded)
						? -drawerWidthResponsive * (1 - expanded)
						: 0
					: isNumber(expanded)
						? drawerWidthResponsive * (1 - expanded)
						: 0
				: 'left' === side
					? -drawerWidthResponsive
					: drawerWidthResponsive;
			setTranslationX(newTranslationX);
		},
		[
			setTranslationX,
			side,
			drawerWidthResponsive,
		]
	);

	const gesture = useMemo(
		() =>
			Gesture.Pan()
				.minDistance(1)
				.onStart(() => {
					prevTranslationX.value = translationX.value;
				})
				.onUpdate((event) => {
					setTranslationX(
						clamp(
							prevTranslationX.value + event.translationX,
							'left' === side ? -drawerWidthResponsive : 0,
							'left' === side ? 0 : drawerWidthResponsive
						)
					);
				})
				.runOnJS(true),
		[
			side,
			prevTranslationX,
			translationX,
			drawerWidthResponsive,
			setTranslationX,
		]
	);

	const getIsFullyCollapsed = useCallback(
		() =>
			'left' === side
				? translationX.value === -drawerWidthResponsive
				: translationX.value === drawerWidthResponsive,
		[
			drawerWidthResponsive,
			translationX,
			side,
		]
	);

	return {
		side,
		drawerWidth: drawerWidthResponsive,
		outerWidth: width,
		showContent,
		gesture,
		animatedStyles,
		expand,
		getIsFullyCollapsed,
	};
};

export default useDrawerState;
