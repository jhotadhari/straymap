/**
 * External dependencies
 */
import React, { FC, useCallback, useContext, useMemo, useState } from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import Sortable, { SortableFlexDragEndParams } from 'react-native-sortables';
import { ScrollView } from 'react-native-gesture-handler';

/**
 * Internal dependencies
 */
import { DrawerPanel, DrawerProps } from '../types';
import {
	selectActiveKey,
	selectControlHandleSide,
	selectItemKeys,
	selectShowSettingsHandle,
	selectSortable,
} from '../selectors';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import DrawerHandle from './DrawerHandle';
import { setItemKeys } from '../slice';
import DrawerContext from '../DrawerContext';
import { DRAWER_HANDLE_SIZE } from '../constants';
import { AppContext } from '../../../Context';
import useDropIndicatorStyle from '../../../compose/useDropIndicatorStyle';
import { PADDING } from '../../../components/MapCornerComponents';

const settingsOverwriteDrawerItem: DrawerPanel = {
	iconSource: 'cog',
};

const DrawerHandles: FC<
	Pick<DrawerProps, 'setModalVisible' | 'side' | 'gesture' | 'expand' | 'getIsFullyCollapsed'>
> = ({ setModalVisible, side, gesture, expand, getIsFullyCollapsed }) => {
	const dispatch = useAppDispatch();

	const itemKeys = useAppSelector((state) => selectItemKeys(state, { side }));
	const activeItemKey = useAppSelector((state) => selectActiveKey(state, { side }));
	const controlHandleSide = useAppSelector(selectControlHandleSide);
	const showSettingsHandle = useAppSelector(selectShowSettingsHandle);
	const sortable = useAppSelector(selectSortable);

	const { setMoveEnabled, mapCornerComponentsHeight } = useContext(AppContext);
	const { setActiveItemKey, height: drawerHeight } = useContext(DrawerContext);

	const [scrollEnabled, setScrollEnabled] = useState(true);

	const dropIndicatorStyle = useDropIndicatorStyle();

	const draggableItems = useMemo(() => itemKeys.map((key) => ({ key })), [itemKeys]);

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
		setScrollEnabled(false);
		setMoveEnabled?.(false);
	}, [setMoveEnabled]);

	const handleDragRelease = useCallback(
		({ indexToKey }: SortableFlexDragEndParams) => {
			setScrollEnabled(true);
			setMoveEnabled?.(true);
			dispatch(
				setItemKeys({
					side,
					itemKeys: indexToKey.map((toKey) => toKey.replace('.$', '')),
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

	const height = useMemo(
		() =>
			getContainerHeight(
				showSettingsHandle && controlHandleSide === side
					? draggableItems.length + 1
					: draggableItems.length
			),
		[
			showSettingsHandle,
			controlHandleSide,
			side,
			draggableItems.length,
			getContainerHeight,
		]
	);

	const styleWrapper = useMemo(
		() => [
			styles.wrapper,
			{
				height: drawerHeight || height,
				maxHeight:
					'right' === side
						? (drawerHeight || height) -
							((mapCornerComponentsHeight ?? 0) + PADDING * 2)
						: drawerHeight || height,
			},
			'left' === side && styles.wrapperLeft,
			'right' === side && styles.wrapperRight,
		],
		[
			drawerHeight,
			side,
			height,
			mapCornerComponentsHeight,
		]
	);

	const styleScrollView = useMemo(
		() => [styles.scrollView, { height: drawerHeight }],
		[drawerHeight]
	);

	const styleContainer = useMemo(
		() => ({
			height,
		}),
		[height]
	);

	const styleControlHandle: ViewProps['style'] = useMemo(
		() => ({
			position: 'absolute',
			top: getContainerHeight(draggableItems.length), // Intentional: even single handles get offset from top edge
		}),
		[draggableItems.length, getContainerHeight]
	);

	const handleSingleItemPress = useCallback(
		() => handleDraggableItemPress(draggableItems[0]),
		[handleDraggableItemPress, draggableItems]
	);

	// Memoized per-item press handlers for the non-sortable multi-item case
	// so DrawerHandle doesn't re-render from inline () => {} props.
	const handleItemPressMap = useMemo(() => {
		const map: Record<string, () => void> = {};
		draggableItems.forEach((item) => {
			map[item.key] = () => handleDraggableItemPress(item);
		});
		return map;
	}, [draggableItems, handleDraggableItemPress]);

	const toggleModalVisible = useCallback(
		() => setModalVisible((visible) => !visible),
		[setModalVisible]
	);

	if ((!showSettingsHandle || controlHandleSide !== side) && draggableItems.length === 0) {
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
						{draggableItems.length > 1 && sortable && (
							<Sortable.Flex
								itemEntering={null}
								gap={0}
								padding={0}
								sortEnabled
								customHandle={false}
								dragActivationDelay={500}
								showDropIndicator
								dropIndicatorStyle={dropIndicatorStyle}
								flexDirection="column"
								flexWrap="nowrap"
								reorderTriggerOrigin="touch"
								alignItems="center"
								onDragStart={handleDragStart}
								onDragEnd={handleDragRelease}
							>
								{draggableItems.map((item) => (
									<View
										key={item.key}
										style={styles.sortableItem}
									>
										<DrawerHandle
											itemKey={item.key}
											gesture={gesture}
											onPress={handleItemPressMap[item.key]}
										/>
									</View>
								))}
							</Sortable.Flex>
						)}
						{(draggableItems.length === 1 ||
							(draggableItems.length > 1 && !sortable)) &&
							draggableItems.map((item) => (
								<View
									key={item.key}
									style={styles.sortableItem}
								>
									<DrawerHandle
										itemKey={item.key}
										gesture={gesture}
										onPress={
											draggableItems.length === 1
												? handleSingleItemPress
												: handleItemPressMap[item.key]
										}
									/>
								</View>
							))}
					</View>

					{showSettingsHandle && controlHandleSide === side && (
						<DrawerHandle
							style={styleControlHandle}
							gesture={gesture}
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
	sortableItem: {
		height: DRAWER_HANDLE_SIZE + DRAWER_HANDLE_SIZE / 2,
		width: DRAWER_HANDLE_SIZE,
	},
});

export default DrawerHandles;
