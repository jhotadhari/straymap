/**
 * External dependencies
 */
import React, { FC, useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from 'react-native-paper';
import Animated from 'react-native-reanimated';

/**
 * Internal dependencies
 */
import { DrawerProps } from '../types';
import { selectActiveKey, selectItemKeys } from '../selectors';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import DrawerContent from './DrawerContent';
import { setActiveKey } from '../slice';
import DrawerContext from '../DrawerContext';
import DrawerHandles from './DrawerHandles';

const Drawer: FC<DrawerProps> = ({
	height,
	side,
	drawerWidth,
	outerWidth,
	showContent,
	gesture,
	animatedStyles,
	expand,
	getIsFullyCollapsed,
	setModalVisible,
}) => {
	const theme = useTheme();

	const dispatch = useAppDispatch();

	const itemKeys = useAppSelector((state) => selectItemKeys(state, { side }));

	const activeItemKey = useAppSelector((state) => selectActiveKey(state, { side }));

	const setActiveItemKey = useCallback(
		(newActiveKey?: string) => {
			dispatch(
				setActiveKey({
					side,
					activeKey: newActiveKey,
				})
			);
		},
		[side]
	);

	// On first open, set first item active, if nothing active.
	useEffect(() => {
		if (showContent && !activeItemKey && itemKeys.length) {
			setActiveItemKey(itemKeys[0]);
		}
	}, [
		setActiveItemKey,
		showContent,
		activeItemKey,
		itemKeys,
	]);

	// On no items, close drawer and set active item undefined.
	useEffect(() => {
		if (!itemKeys.length) {
			expand(false);
			setActiveItemKey(undefined);
		}
	}, [
		setActiveItemKey,
		itemKeys.length,
		expand,
	]);

	const styleWrapper: ViewStyle[] = useMemo(
		() => [
			styles.wrapper,
			{
				alignItems: 'left' === side ? 'flex-start' : 'flex-end',
				width: outerWidth,
				height,
			},
		],
		[
			side,
			outerWidth,
			height,
		]
	);

	const styleDrawer = useMemo(
		() => [
			animatedStyles,
			{
				width: drawerWidth,
				height,
				backgroundColor: theme.colors.background,
			},
		],
		[
			animatedStyles,
			drawerWidth,
			height,
			theme,
		]
	);

	return (
		<DrawerContext.Provider
			value={{
				side,
				activeItemKey,
				width: drawerWidth,
				height,
				getIsFullyCollapsed,
				setActiveItemKey,
				expand,
			}}
		>
			<View style={styleWrapper}>
				<Animated.View style={styleDrawer}>
					<DrawerHandles
						setModalVisible={setModalVisible}
						side={side}
						gesture={gesture}
						expand={expand}
						getIsFullyCollapsed={getIsFullyCollapsed}
					/>

					{activeItemKey && showContent && <DrawerContent />}
				</Animated.View>
			</View>
		</DrawerContext.Provider>
	);
};

const styles = StyleSheet.create({
	wrapper: {
		position: 'absolute',
		top: 0,
		left: 0,
	},
});

export default Drawer;
