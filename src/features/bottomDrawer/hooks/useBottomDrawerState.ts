/**
 * External dependencies
 */
import { useCallback, useContext, useMemo, useState } from 'react';
import {
	runOnJS,
	useAnimatedReaction,
	useAnimatedStyle,
	useSharedValue,
	type SharedValue,
} from 'react-native-reanimated';
import { Gesture } from 'react-native-gesture-handler';

/**
 * Internal dependencies
 */
import { BottomDrawerState } from '../types';
import { BOTTOM_DRAWER_CONTENT_HEIGHT } from '../constants';
import { AppContext } from '../../../Context';

const useBottomDrawerState = ({
	onSettle,
	height,
}: {
	onSettle?: (height: number) => void;
	height: SharedValue<number>;
}): BottomDrawerState => {
	const collapsed = 0;
	const max = BOTTOM_DRAWER_CONTENT_HEIGHT;

	const { drawerGestureRef } = useContext(AppContext);

	const beginDrawerGesture = useCallback(() => {
		drawerGestureRef.current.active += 1;
	}, [drawerGestureRef]);

	const endDrawerGesture = useCallback(() => {
		if (drawerGestureRef.current.active > 0) {
			drawerGestureRef.current.active -= 1;
		}
		// Grace window: swallow map press events that arrive just after the
		// finger lifts (the map's native long-press fires ~500ms after down).
		drawerGestureRef.current.until = Date.now() + 700;
	}, [drawerGestureRef]);

	const prevHeight = useSharedValue(collapsed);

	const [showContent, setShowContent] = useState(false);

	// Mount the drawer content once the drawer first leaves the collapsed
	// position and unmount it again when it collapses back — the chart's
	// map-interval polling would otherwise keep running while the drawer
	// is closed. Runs on the UI thread and escapes to JS only on the
	// 0 <-> >0 transitions, so it never contends with the gesture's
	// per-frame SharedValue writes (mirrors the side drawers' useDrawerState).
	useAnimatedReaction(
		() => height.value > collapsed,
		(isOpen: boolean, prev: boolean | null) => {
			if (isOpen && (null === prev || !prev)) {
				runOnJS(setShowContent)(true);
			} else if (!isOpen && prev === true) {
				runOnJS(setShowContent)(false);
			}
		},
		[collapsed]
	);

	const animatedStyles = useAnimatedStyle(() => ({
		height: height.value,
	}));

	// Worklet: writes the SharedValue only. No JS escape here — this runs on
	// every gesture frame and must not trigger React re-renders.
	const setHeight = useCallback(
		(newVal: number) => {
			'worklet';
			height.value = newVal;
		},
		[height]
	);

	// Worklet: reports the settled height back to JS so the side drawers'
	// mapHeight stays in sync. Called only on settle (gesture end / expand),
	// never per-frame.
	const notifySettle = useCallback(
		(h: number) => {
			'worklet';
			if (onSettle) {
				runOnJS(onSettle)(h);
			}
		},
		[onSettle]
	);

	const expand = useCallback(
		(expanded: number | boolean) => {
			'worklet';
			const newHeight = expanded
				? 'number' === typeof expanded
					? collapsed + (max - collapsed) * expanded
					: max
				: collapsed;
			setHeight(newHeight);
			notifySettle(newHeight);
		},
		[
			setHeight,
			notifySettle,
			collapsed,
			max,
		]
	);

	const gesture = useMemo(
		() =>
			Gesture.Pan()
				.activeOffsetY([-10, 10])
				.failOffsetX([-10, 10])
				.minDistance(1)
				.onBegin(() => {
					// While a finger is on the handle, suppress map press
					// handling — the native map would otherwise still emit
					// tap/long-press events for the same touch stream.
					runOnJS(beginDrawerGesture)();
				})
				.onFinalize(() => {
					runOnJS(endDrawerGesture)();
				})
				.onStart(() => {
					prevHeight.value = height.value;
				})
				.onUpdate((event) => {
					// Swipe up (negative translationY) opens: increase height.
					const clamped = Math.max(
						collapsed,
						Math.min(max, prevHeight.value - event.translationY)
					);
					setHeight(clamped);
				})
				.onEnd((event) => {
					const velocityThreshold = 500;
					const isFast = Math.abs(event.velocityY) > velocityThreshold;
					if (!isFast) {
						// Slow release: free-drag — leave the drawer at the finger's
						// position (any height between collapsed and open).
						notifySettle(height.value);
						return;
					}
					// Fast flick: snap fully open/closed based on swipe direction.
					const opening = event.velocityY < 0;
					expand(opening);
				}),
		[
			collapsed,
			max,
			prevHeight,
			height,
			setHeight,
			notifySettle,
			expand,
			beginDrawerGesture,
			endDrawerGesture,
		]
	);

	const getIsFullyCollapsed = useCallback(() => height.value === collapsed, [height, collapsed]);

	return useMemo(
		() => ({
			showContent,
			gesture,
			animatedStyles,
			collapsedHeight: collapsed,
			openHeight: max,
			height,
			expand,
			getIsFullyCollapsed,
		}),
		[
			showContent,
			gesture,
			animatedStyles,
			collapsed,
			max,
			height,
			expand,
			getIsFullyCollapsed,
		]
	);
};

export default useBottomDrawerState;
