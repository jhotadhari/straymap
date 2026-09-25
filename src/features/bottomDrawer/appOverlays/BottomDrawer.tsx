/**
 * External dependencies
 */
import React, { FC, useCallback, useContext, useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { selectActiveKey, selectItemKeys } from '../selectors';
import { setActiveKey } from '../slice';
import BottomDrawerContext from '../BottomDrawerContext';
import useBottomDrawerState from '../hooks/useBottomDrawerState';
import BottomDrawerHandles from '../components/BottomDrawerHandles';
import BottomDrawerContent from '../components/BottomDrawerContent';
import { AppContext } from '../../../Context';
import { BOTTOM_DRAWER_CONTENT_HEIGHT } from '../constants';

const BottomDrawer: FC = () => {
	const dispatch = useAppDispatch();

	const { setBottomBarHeight, bottomDrawerControlsRef, bottomDrawerHeightSv } =
		useContext(AppContext);

	const itemKeys = useAppSelector(selectItemKeys);
	const activeItemKey = useAppSelector(selectActiveKey);

	const { width } = useMemo(() => Dimensions.get('window'), []);

	const handleSettle = useCallback(
		(height: number) => {
			setBottomBarHeight?.((prev) => ({
				...prev,
				bottomDrawer: height,
			}));
		},
		[setBottomBarHeight]
	);

	const {
		showContent,
		gesture,
		animatedStyles,
		collapsedHeight,
		height,
		expand,
		getIsFullyCollapsed,
	} = useBottomDrawerState({ onSettle: handleSettle, height: bottomDrawerHeightSv });

	const setActiveItemKey = useCallback(
		(newActiveKey?: string) => {
			dispatch(setActiveKey(newActiveKey));
		},
		[dispatch]
	);

	// On first open, set first item active, if nothing active.
	useEffect(() => {
		if (showContent && !activeItemKey && itemKeys.length) {
			setActiveItemKey(itemKeys[0]);
		}
	}, [
		showContent,
		activeItemKey,
		itemKeys,
		setActiveItemKey,
	]);

	// On no items, collapse the drawer and clear the active item.
	useEffect(() => {
		if (!itemKeys.length) {
			expand(false);
			setActiveItemKey(undefined);
		}
	}, [
		itemKeys.length,
		expand,
		setActiveItemKey,
	]);

	// Keep the side drawers' mapHeight in sync: report the collapsed handle-bar
	// height (or zero when there are no items) whenever the item set changes.
	useEffect(() => {
		handleSettle(itemKeys.length ? collapsedHeight : 0);
	}, [
		itemKeys.length,
		collapsedHeight,
		handleSettle,
	]);

	// Wire the imperative controls so other logic can open/close the drawer.
	useEffect(() => {
		bottomDrawerControlsRef.current = {
			height,
			getIsFullyCollapsed,
			expand,
		};
	}, [
		bottomDrawerControlsRef,
		height,
		getIsFullyCollapsed,
		expand,
	]);

	const contextValue = useMemo(
		() => ({
			activeItemKey,
			width,
			height: BOTTOM_DRAWER_CONTENT_HEIGHT,
			getIsFullyCollapsed,
			setActiveItemKey,
			expand,
		}),
		[
			activeItemKey,
			width,
			getIsFullyCollapsed,
			setActiveItemKey,
			expand,
		]
	);

	const styleContainer: ViewStyle[] = useMemo(
		() => [styles.container, animatedStyles],
		[animatedStyles]
	);

	if (!itemKeys.length) {
		return null;
	}

	return (
		<BottomDrawerContext.Provider value={contextValue}>
			<Animated.View style={styleContainer}>
				<BottomDrawerHandles gesture={gesture} />
				{showContent && activeItemKey && <BottomDrawerContent />}
			</Animated.View>
		</BottomDrawerContext.Provider>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: 'column',
		zIndex: 40, // above side drawers (30), below dashboard (50)
	},
});

export default BottomDrawer;
