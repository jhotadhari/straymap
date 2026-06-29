/**
 * External dependencies
 */
import React, { FC, useCallback, useContext, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import DraggableGrid from 'react-native-draggable-grid';
import { ScrollView } from 'react-native-gesture-handler';

/**
 * Internal dependencies
 */
import { DrawerItem, DrawerProps } from '../types';
import { selectActiveKey, selectControlHandleSide, selectItemKeys } from '../selectors';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import DrawerHandle from './DrawerHandle';
import { setItemKeys } from '../slice';
import DrawerContext from '../DrawerContext';
import { DRAWER_HANDLE_SIZE } from '../constants';
import { AppContext } from '../../../../Context';

const settingsOverwriteDrawerItem: DrawerItem = {
	iconSource: 'cog',
};

const DrawerHandles: FC<
	Pick<DrawerProps, 'setModalVisible' | 'side' | 'gesture' | 'expand' | 'getIsFullyCollapsed'>
> = ({ setModalVisible, side, gesture, expand, getIsFullyCollapsed }) => {
	const dispatch = useAppDispatch();

	const itemKeys = useAppSelector((state) => selectItemKeys(state, { side }));
	const activeItemKey = useAppSelector((state) => selectActiveKey(state, { side }));
	const controlHandleSide = useAppSelector(selectControlHandleSide);

	const { setMoveEnabled } = useContext(AppContext);
	const { setActiveItemKey, height } = useContext(DrawerContext);

	const [scrollEnabled, setScrollEnabled] = useState(true);

	const [panEnabled, setPanEnabled] = useState<boolean>(true);

	const draggableItems = useMemo(() => itemKeys.map((key) => ({ key })), [itemKeys]);

	const RenderItem = useCallback(
		({ key }: { key?: string }) => {
			return (
				<View key={key}>
					<DrawerHandle
						itemKey={key}
						gesture={gesture}
						panEnabled={panEnabled}
					/>
				</View>
			);
		},
		[gesture, panEnabled]
	);

	const handleDraggableItemPress = useCallback(
		({ key }: { key: string }) => {
			if (key === activeItemKey) {
				expand(getIsFullyCollapsed());
			} else {
				setActiveItemKey(key);
				if (getIsFullyCollapsed()) {
					expand(true);
				}
			}
		},
		[
			activeItemKey,
			expand,
			getIsFullyCollapsed,
			setActiveItemKey,
		]
	);

	const handleDragStart = useCallback(() => {
		setPanEnabled(false);
		setScrollEnabled(false);
		setMoveEnabled?.(false);
	}, [setMoveEnabled]);

	const handleDragRelease = useCallback(
		(newDraggableItems: { key: string }[]) => {
			setPanEnabled(true);
			setScrollEnabled(true);
			setMoveEnabled?.(true);
			dispatch(
				setItemKeys({
					side,
					itemKeys: newDraggableItems.map((o) => o.key),
				})
			);
		},
		[
			dispatch,
			setMoveEnabled,
			side,
		]
	);

	const getContainerHeight = useCallback(
		(itemsCount: number) =>
			itemsCount * DRAWER_HANDLE_SIZE + itemsCount * (DRAWER_HANDLE_SIZE / 2),
		[]
	);

	const styleWrapper = useMemo(
		() => [
			styles.wrapper,
			{ height },
			'left' === side && styles.wrapperLeft,
			'right' === side && styles.wrapperRight,
		],
		[height, side]
	);

	const styleScrollView = useMemo(() => [styles.scrollView, { height }], [height]);

	const styleContainer = useMemo(
		() => ({
			height: getContainerHeight(
				controlHandleSide === side ? draggableItems.length + 1 : draggableItems.length
			),
		}),
		[
			controlHandleSide,
			side,
			draggableItems.length,
			getContainerHeight,
		]
	);

	const styleControlHandle = useMemo(
		() => ({
			top: draggableItems.length > 1 ? getContainerHeight(draggableItems.length) : 0,
		}),
		[draggableItems.length, getContainerHeight]
	);

	const handleSingleItemPress = useCallback(
		() => handleDraggableItemPress(draggableItems[0]),
		[handleDraggableItemPress, draggableItems]
	);

	const toggleModalVisible = useCallback(
		() => setModalVisible((visible) => !visible),
		[setModalVisible]
	);

	if (controlHandleSide !== side && draggableItems.length === 0) {
		return undefined;
	}

	return (
		<View style={styleWrapper}>
			<ScrollView
				scrollEnabled={scrollEnabled}
				style={styleScrollView}
			>
				<View style={styleContainer}>
					<View>
						{draggableItems.length > 1 && (
							<DraggableGrid
								itemHeight={DRAWER_HANDLE_SIZE + DRAWER_HANDLE_SIZE / 2}
								numColumns={1}
								renderItem={RenderItem}
								data={draggableItems}
								onDragStart={handleDragStart}
								onDragRelease={handleDragRelease}
								onItemPress={handleDraggableItemPress}
							/>
						)}
						{draggableItems.length === 1 && (
							<DrawerHandle
								itemKey={draggableItems[0].key}
								gesture={gesture}
								panEnabled={panEnabled}
								onPress={handleSingleItemPress}
							/>
						)}
					</View>

					{controlHandleSide === side && (
						<DrawerHandle
							style={styleControlHandle}
							gesture={gesture}
							panEnabled={panEnabled}
							onPress={toggleModalVisible}
							overwriteDrawerItem={settingsOverwriteDrawerItem}
						/>
					)}
				</View>
			</ScrollView>
		</View>
	);
};

const styles = StyleSheet.create({
	wrapper: {
		position: 'absolute',
		width: DRAWER_HANDLE_SIZE,
		backgroundColor: 'transparent',
	},
	wrapperLeft: {
		right: 0,
		transform: [
			{ translateX: '100%' },
			{ translateX: -1 }, // because the borderWidth is `1`. See src/store/features/drawers/components/DrawerHandle.tsx styles.handle
		],
	},
	wrapperRight: {
		left: 0,
		transform: [
			{ translateX: '-100%' },
			{ translateX: 1 }, // because the borderWidth is `1`. See src/store/features/drawers/components/DrawerHandle.tsx styles.handle
		],
	},
	scrollView: {
		overflow: 'visible',
		width: DRAWER_HANDLE_SIZE,
	},
});

export default DrawerHandles;
