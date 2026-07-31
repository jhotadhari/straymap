/**
 * External dependencies
 */
import { useCallback, useMemo, useState } from 'react';
import {
	SharedValue,
	runOnJS,
	useAnimatedReaction,
	useAnimatedStyle,
	useSharedValue,
} from 'react-native-reanimated';
import { Gesture } from 'react-native-gesture-handler';
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

	// Closed = fully off-screen; open = flush with the screen edge.
	const min = 'left' === side ? -drawerWidthResponsive : 0;
	const max = 'left' === side ? 0 : drawerWidthResponsive;
	const collapsed = 'left' === side ? -drawerWidthResponsive : drawerWidthResponsive;

	const prevTranslationX = useSharedValue(collapsed);

	const [showContent, setShowContent] = useState(false);

	// Mount the drawer content once the drawer first leaves the collapsed
	// position. This runs on the UI thread and escapes to JS only on the
	// 0 -> >0 transition, so it never contends with the gesture's per-frame
	// SharedValue writes (which is what caused the open-on-gesture jump when
	// setShowContent ran synchronously inside the writer on the JS thread).
	useAnimatedReaction(
		() => {
			// openFraction: 0 = collapsed, 1 = fully open.
			return 'left' === side
				? (translationX.value - min) / (max - min)
				: (max - translationX.value) / (max - min);
		},
		(openFraction: number, prev: number | null) => {
			if ((null === prev || prev <= 0) && openFraction > 0) {
				runOnJS(setShowContent)(true);
			}
		},
		[
			side,
			min,
			max,
		]
	);

	const animatedStyles = useAnimatedStyle(() => ({
		transform: [{ translateX: translationX.value }],
	}));

	// Worklet: writes the SharedValue and maybe shrinks the opposite drawer.
	// Shared by the gesture (UI thread) and by expand (called from both UI and
	// JS). No React state here — content mounting is handled by the reaction
	// above, so this stays safe to call from a worklet.
	const setTranslationX = useCallback(
		(newVal: number) => {
			'worklet';
			translationX.value = newVal;
			// Maybe shrink other so both drawers don't overflow the screen.
			const remaining =
				'left' === side
					? width - newVal - drawerWidthResponsive
					: width + newVal - drawerWidthResponsive;
			const remainingOther =
				'left' === side
					? width + translationXOther.value - drawerWidthResponsive
					: width - translationXOther.value - drawerWidthResponsive;
			if (remaining - (width - remainingOther) < width / 3) {
				const otherTarget =
					'right' === side ? newVal - (width * 2) / 3 : newVal + (width * 2) / 3;
				const otherMin = 'right' === side ? -drawerWidthResponsive : 0;
				const otherMax = 'right' === side ? 0 : drawerWidthResponsive;
				translationXOther.value = Math.max(otherMin, Math.min(otherMax, otherTarget));
			}
		},
		[
			side,
			drawerWidthResponsive,
			width,
			translationX,
			translationXOther,
		]
	);

	const expand = useCallback(
		(
			expanded:
				| number // fraction between 0 and 1
				| boolean
		) => {
			'worklet';
			const newTranslationX = expanded
				? 'left' === side
					? 'number' === typeof expanded
						? -drawerWidthResponsive * (1 - expanded)
						: 0
					: 'number' === typeof expanded
						? drawerWidthResponsive * (1 - expanded)
						: 0
				: collapsed;
			setTranslationX(newTranslationX);
		},
		[
			setTranslationX,
			side,
			drawerWidthResponsive,
			collapsed,
		]
	);

	const gesture = useMemo(
		() =>
			Gesture.Pan()
				.activeOffsetX([-2, 2])
				.failOffsetY([-10, 10])
				.minDistance(1)
				.onStart(() => {
					prevTranslationX.value = translationX.value;
				})
				.onUpdate((event) => {
					const clamped = Math.max(
						min,
						Math.min(max, prevTranslationX.value + event.translationX)
					);
					setTranslationX(clamped);
				})
				.onEnd((event) => {
					const velocityThreshold = 500;
					const isFast = Math.abs(event.velocityX) > velocityThreshold;
					if (!isFast) {
						// Slow release: leave the drawer at the finger's position
						// (any amount open, including half open).
						return;
					}
					// Fast flick: snap fully open/closed based on swipe direction.
					const opening =
						'left' === side
							? event.velocityX > 0 // swipe right opens left drawer
							: event.velocityX < 0; // swipe left opens right drawer
					expand(opening);
				}),
		[
			side,
			min,
			max,
			prevTranslationX,
			translationX,
			setTranslationX,
			expand,
		]
	);

	const getIsFullyCollapsed = useCallback(
		() => translationX.value === collapsed,
		[translationX, collapsed]
	);

	return useMemo(
		() => ({
			side,
			drawerWidth: drawerWidthResponsive,
			outerWidth: width,
			showContent,
			gesture,
			animatedStyles,
			expand,
			getIsFullyCollapsed,
		}),
		[
			side,
			drawerWidthResponsive,
			width,
			showContent,
			gesture,
			animatedStyles,
			expand,
			getIsFullyCollapsed,
		]
	);
};

export default useDrawerState;
