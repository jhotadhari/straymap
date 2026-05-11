/**
 * External dependencies
 */
import React, { Dispatch, FC, SetStateAction, useCallback, useState } from 'react';
import { View } from 'react-native';
import { useTheme } from 'react-native-paper';
import Animated from 'react-native-reanimated';

/**
 * Internal dependencies
 */
import { DrawerState } from '../types';
import { selectActiveKey, selectItemKeys } from '../selectors';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import DrawerContent from './DrawerContent';
import DrawerHandle from './DrawerHandle';
import { setActiveKey } from '../drawersSlice';
import DrawerContext from '../DrawerContext';

interface DrawerProps extends DrawerState {
	height: number;
	showControlHandle?: boolean;
	setModalVisible: Dispatch<SetStateAction<boolean>>;
}

const Drawer: FC<DrawerProps> = ({
	height,
	showControlHandle,
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
					{itemKeys &&
						[...itemKeys].map((itemKey, index) => (
							<DrawerHandle
								key={index}
								index={index}
								itemKey={itemKey}
								gesture={gesture}
							/>
						))}

					{showControlHandle && (
						<DrawerHandle
							index={itemKeys.length}
							gesture={gesture}
							onPress={() => setModalVisible((visible) => !visible)}
							overwriteDrawerItem={{
								key: null,
								iconSource: 'plus',
							}}
						/>
					)}

					{activeItemKey && showContent && <DrawerContent />}
				</Animated.View>
			</View>
		</DrawerContext.Provider>
	);
};

export default Drawer;
