/**
 * External dependencies
 */
import { useCallback, useMemo, useState } from 'react';
import { SharedValue, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Gesture } from 'react-native-gesture-handler';
import { clamp, isNumber } from 'lodash-es';

/**
 * Internal dependencies
 */
import { DrawerState } from '../types';

const useDrawerState = ({
	side,
	drawerWidth = 300,
	outerWidth,
	translationX,
	translationXOther,
}: {
	side: string;
	drawerWidth?: number;
	outerWidth: number;
	translationX: SharedValue<number>;
	translationXOther: SharedValue<number>;
}): DrawerState => {
	drawerWidth = drawerWidth <= (outerWidth * 2) / 3 ? drawerWidth : (outerWidth * 2) / 3;

	const prevTranslationX = useSharedValue('left' === side ? -drawerWidth : drawerWidth);

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
					? outerWidth - newVal - drawerWidth
					: outerWidth + newVal - drawerWidth;
			const remainingOther =
				'left' === side
					? outerWidth + translationXOther.value - drawerWidth
					: outerWidth - translationXOther.value - drawerWidth;
			if (remaining - (outerWidth - remainingOther) < outerWidth / 3) {
				translationXOther.value = clamp(
					'right' === side
						? newVal - (outerWidth * 2) / 3
						: newVal + (outerWidth * 2) / 3,
					'right' === side ? -drawerWidth : 0,
					'right' === side ? 0 : drawerWidth
				);
			}
		},
		[
			side,
			drawerWidth,
			outerWidth,
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
						? -drawerWidth * (1 - expanded)
						: 0
					: isNumber(expanded)
						? drawerWidth * (1 - expanded)
						: 0
				: 'left' === side
					? -drawerWidth
					: drawerWidth;
			setTranslationX(newTranslationX);
		},
		[
			setTranslationX,
			side,
			drawerWidth,
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
							'left' === side ? -drawerWidth : 0,
							'left' === side ? 0 : drawerWidth
						)
					);
				})
				.runOnJS(true),
		[
			side,
			prevTranslationX,
			translationX,
			drawerWidth,
		]
	);

	const getIsFullyCollapsed = useCallback(
		() =>
			'left' === side
				? translationX.value === -drawerWidth
				: translationX.value === drawerWidth,
		[
			drawerWidth,
			translationX,
			side,
		]
	);

	return {
		side,
		drawerWidth,
		outerWidth,
		showContent,
		gesture,
		animatedStyles,
		expand,
		getIsFullyCollapsed,
	};
};

export default useDrawerState;
