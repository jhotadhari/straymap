/**
 * External dependencies
 */
import React, { FC, useCallback, useContext, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import DraggableGrid from 'react-native-draggable-grid';
import { ScrollView } from 'react-native-gesture-handler';
import { MapContainerModule } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { DrawerProps } from '../types';
import { selectActiveKey, selectControlHandleSide, selectItemKeys } from '../selectors';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import DrawerHandle from './DrawerHandle';
import { setItemKeys } from '../slice';
import DrawerContext from '../DrawerContext';
import { handleSize } from '../constants';
import { AppContext } from '../../../../Context';

const DrawerHandles: FC<
	Pick<DrawerProps, 'setModalVisible' | 'side' | 'gesture' | 'expand' | 'getIsFullyCollapsed'>
> = ({ setModalVisible, side, gesture, expand, getIsFullyCollapsed }) => {
	const dispatch = useAppDispatch();

	const itemKeys = useAppSelector((state) => selectItemKeys(state, { side }));
	const activeItemKey = useAppSelector((state) => selectActiveKey(state, { side }));
	const controlHandleSide = useAppSelector(selectControlHandleSide);

	const { mapViewNativeNodeHandle } = useContext(AppContext);
	const { setActiveItemKey, height } = useContext(DrawerContext);

	const [scrollEnabled, setScrollEnabled] = useState(true);

	const [panEnabled, setPanEnabled] = useState<boolean>(true);

	const draggableItems = [...itemKeys].map((key) => ({ key }));

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
		[activeItemKey]
	);

	const handleDragStart = useCallback(() => {
		setPanEnabled(false);
		setScrollEnabled(false);
		MapContainerModule.setPropsInteractionsEnabled(mapViewNativeNodeHandle, 'moveEnabled', 0);
	}, [mapViewNativeNodeHandle]);

	const handleDragRelease = useCallback(
		(newDraggableItems: { key: string }[]) => {
			setPanEnabled(true);
			setScrollEnabled(true);
			MapContainerModule.setPropsInteractionsEnabled(
				mapViewNativeNodeHandle,
				'moveEnabled',
				1
			);
			dispatch(
				setItemKeys({
					side,
					itemKeys: newDraggableItems.map((o) => o.key),
				})
			);
		},
		[mapViewNativeNodeHandle, side]
	);

	const getContainerHeight = useCallback(
		(itemsCount: number) => itemsCount * handleSize + itemsCount * (handleSize / 2),
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
								itemHeight={handleSize + handleSize / 2}
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
								onPress={() => handleDraggableItemPress(draggableItems[0])}
							/>
						)}
					</View>

					{controlHandleSide === side && (
						<DrawerHandle
							style={styleControlHandle}
							gesture={gesture}
							panEnabled={panEnabled}
							onPress={() => setModalVisible((visible) => !visible)}
							overwriteDrawerItem={{
								iconSource: 'cog',
							}}
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
		width: handleSize,
		backgroundColor: 'transparent',
	},
	wrapperLeft: {
		right: 0,
		transform: [{ translateX: '100%' }],
	},
	wrapperRight: {
		left: 0,
		transform: [{ translateX: '-100%' }],
	},
	scrollView: {
		overflow: 'visible',
		width: handleSize,
	},
});

export default DrawerHandles;
