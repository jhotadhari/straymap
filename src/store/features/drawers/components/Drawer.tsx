/**
 * External dependencies
 */
import React, { FC, useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { useTheme } from 'react-native-paper';
import Animated from 'react-native-reanimated';

/**
 * Internal dependencies
 */
import { DrawerProps } from '../types';
import { selectActiveKey, selectItemKeys } from '../selectors';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import DrawerContent from './DrawerContent';
import { setActiveKey } from '../drawersSlice';
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

	useEffect(() => {
		if (showContent && !activeItemKey && itemKeys.length) {
			setActiveItemKey(itemKeys[0]);
		}
	}, [
		showContent,
		activeItemKey,
		itemKeys,
	]);

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
			<View
				style={{
					position: 'absolute',
					top: 0,
					left: 0,
					alignItems: 'left' === side ? 'flex-start' : 'flex-end',
					width: outerWidth,
					height,
				}}
			>
				<Animated.View
					style={[
						animatedStyles,
						{
							width: drawerWidth,
							height,
							backgroundColor: theme.colors.background,
						},
					]}
				>
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

export default Drawer;
