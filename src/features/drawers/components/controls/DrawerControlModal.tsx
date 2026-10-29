/**
 * External dependencies
 */
import { Dimensions, StyleSheet, TouchableHighlight, View } from 'react-native';
import { Dispatch, FC, SetStateAction, useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon, Text, useTheme } from 'react-native-paper';
import { get } from 'lodash-es';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
	Easing,
	runOnJS,
	SharedValue,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';

/**
 * Internal dependencies
 */
import { featureRegistry } from '../../../FeatureRegistry';
import ModalWrapper from '../../../../components/generic/wrapper/ModalWrapper';
import { DrawerPanel, DrawerSide } from '../../types';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { selectItemKeys } from '../../selectors';
import { moveItemKey, toggleItemKeySide } from '../../slice';
import { DRAWER_ICON_SIZE } from '../../constants';
import { MODAL_PADDING, MODAL_WIDTH_FACTOR } from '../../../../constants';
import { computeDropTarget, getRowTop, getSectionLayouts, SectionLayout } from '../../utils';
import useDropIndicatorStyle from '../../../../compose/useDropIndicatorStyle';

const SECTION_KEYS: DrawerSide[] = [
	'left',
	'right',
	'available',
];

// Fixed heights — the drag math derives everything from these.
const ITEM_HEIGHT = 62;
const SECTION_HEADER_HEIGHT = 40;
const EMPTY_SECTION_HEIGHT = SECTION_HEADER_HEIGHT + ITEM_HEIGHT;

const DROP_ANIMATION_DURATION = 180;
const GAP_ANIMATION_DURATION = 150;
const INDICATOR_ANIMATION_DURATION = 120;

interface DropSlot {
	side: DrawerSide;
	index: number;
}

const CircleButton: FC<{
	checked: boolean;
	onPress: () => void;
}> = ({ checked, onPress }) => {
	const theme = useTheme();

	const styleCircle = useMemo(
		() => [
			styles.circleButton,
			{
				borderColor: checked ? theme.colors.primary : theme.colors.outline,
				backgroundColor: checked ? theme.colors.primary : 'transparent',
			},
		],
		[checked, theme]
	);

	return (
		<TouchableHighlight
			style={styleCircle}
			underlayColor={theme.colors.elevation.level3}
			onPress={onPress}
		>
			<Icon
				source="check"
				size={16}
				color={checked ? theme.colors.onPrimary : 'transparent'}
			/>
		</TouchableHighlight>
	);
};

const ItemContent: FC<{
	itemKey: string;
}> = ({ itemKey }) => {
	const { t } = useTranslation();
	const theme = useTheme();

	const drawerItem = useMemo(
		() =>
			get(featureRegistry.getDrawerPanels() as { [itemKey: string]: DrawerPanel }, [
				itemKey,
			]) as DrawerPanel | undefined,
		[itemKey]
	);

	const { IconComponent, iconSource } = useMemo(() => {
		const IconComponent = get(drawerItem, 'IconComponent');
		const iconSource = IconComponent ? undefined : get(drawerItem, 'iconSource');
		return {
			IconComponent,
			iconSource,
		};
	}, [drawerItem]);

	return (
		<>
			{IconComponent && (
				<IconComponent
					color={theme.colors.onBackground}
					size={DRAWER_ICON_SIZE}
				/>
			)}
			{iconSource && (
				<Icon
					source={iconSource}
					size={25}
					color={theme.colors.onBackground}
				/>
			)}
			{drawerItem?.label && <Text style={styles.label}>{t(drawerItem?.label ?? '')}</Text>}
		</>
	);
};

const Item: FC<{
	itemKey: string;
	side: DrawerSide;
	index: number;
	isOnLeft: boolean;
	isOnRight: boolean;
	handleToggle: (side: 'left' | 'right') => void;
	dragGesture: ReturnType<typeof Gesture.Pan>;
	dragKeySv: SharedValue<string>;
	dragHomeSv: SharedValue<DropSlot | null>;
	dragTargetSv: SharedValue<DropSlot | null>;
}> = ({
	itemKey,
	side,
	index,
	isOnLeft,
	isOnRight,
	handleToggle,
	dragGesture,
	dragKeySv,
	dragHomeSv,
	dragTargetSv,
}) => {
	const dimStyle = useAnimatedStyle(() => ({
		opacity: dragKeySv.value === itemKey ? 0.35 : 1,
	}));

	// Live gap: rows shift out of the way while a drag is active so the
	// drop slot becomes visible. Offset 0 renders without an animation so
	// releasing the drag snaps the rows back instantly — the layout
	// re-render from the dispatch compensates the shift in the same frame.
	const gapStyle = useAnimatedStyle(() => {
		const home = dragHomeSv.value;
		const target = dragTargetSv.value;
		let offsetY = 0;
		if (home && target && dragKeySv.value !== itemKey) {
			if (target.side === home.side) {
				if (target.index > home.index && index > home.index && index <= target.index) {
					offsetY = -ITEM_HEIGHT;
				} else if (
					target.index < home.index &&
					index >= target.index &&
					index < home.index
				) {
					offsetY = ITEM_HEIGHT;
				}
			} else {
				if (side === home.side && index > home.index) {
					offsetY = -ITEM_HEIGHT;
				} else if (side === target.side && index >= target.index) {
					offsetY = ITEM_HEIGHT;
				}
			}
		}
		return {
			transform: [
				{
					translateY:
						0 === offsetY
							? 0
							: withTiming(offsetY, { duration: GAP_ANIMATION_DURATION }),
				},
			],
		};
	});

	return (
		<Animated.View
			style={[
				styles.itemRow,
				dimStyle,
				gapStyle,
			]}
		>
			<CircleButton
				checked={isOnLeft}
				onPress={() => handleToggle('left')}
			/>

			<GestureDetector gesture={dragGesture}>
				<View style={styles.itemCenter}>
					<ItemContent itemKey={itemKey} />
				</View>
			</GestureDetector>

			<CircleButton
				checked={isOnRight}
				onPress={() => handleToggle('right')}
			/>
		</Animated.View>
	);
};

const DrawerControlModal: FC<{
	modalVisible: boolean;
	setModalVisible: Dispatch<SetStateAction<boolean>>;
}> = ({ modalVisible, setModalVisible }) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const closeModal = useCallback(() => setModalVisible(false), [setModalVisible]);

	const dispatch = useAppDispatch();

	const itemKeysLeft = useAppSelector((state) => selectItemKeys(state, { side: 'left' }));
	const itemKeysRight = useAppSelector((state) => selectItemKeys(state, { side: 'right' }));
	const itemKeysAvailable = useAppSelector((state) =>
		selectItemKeys(state, { side: 'available' })
	);

	const [scrollEnabled, setScrollEnabled] = useState(true);

	// Content of the floating clone — set on drag start so the clone can
	// render the dragged row while it follows the finger.
	const [dragItemKey, setDragItemKey] = useState<string | null>(null);

	const itemKeysBySide = useMemo(
		() => ({
			left: itemKeysLeft,
			right: itemKeysRight,
			available: itemKeysAvailable,
		}),
		[
			itemKeysLeft,
			itemKeysRight,
			itemKeysAvailable,
		]
	);

	const sectionLabels = useMemo(
		() => ({
			left: t('drawers.sectionLeft'),
			right: t('drawers.sectionRight'),
			available: t('drawers.sectionAvailable'),
		}),
		[t]
	);

	const { width: screenW } = useMemo(() => Dimensions.get('window'), []);

	const sectionWidth = useMemo(() => screenW * MODAL_WIDTH_FACTOR - 2 * MODAL_PADDING, [screenW]);

	// Section geometry derived from the current item counts.
	const layout = useMemo(
		() =>
			getSectionLayouts(
				SECTION_KEYS.map((side) => ({
					side,
					itemCount: itemKeysBySide[side].length,
				})),
				SECTION_HEADER_HEIGHT,
				ITEM_HEIGHT,
				EMPTY_SECTION_HEIGHT
			),
		[itemKeysBySide]
	);

	// Drag runtime state
	const dragKeySv = useSharedValue('');
	const draggingSv = useSharedValue(0);
	const cloneTopSv = useSharedValue(0);
	const dragHomeSv = useSharedValue<DropSlot | null>(null);
	const dragTargetSv = useSharedValue<DropSlot | null>(null);
	const indicatorTopSv = useSharedValue(0);
	const dragStartYRef = useRef(0);
	const dragActiveRef = useRef(false);
	// Snapshot of the section layout captured on drag start — the gesture
	// runs on the JS thread, so it reads the layout via this ref instead of
	// a (possibly stale) render closure.
	const layoutRef = useRef<SectionLayout[]>(layout);
	layoutRef.current = layout;

	const handleToggle = useCallback(
		(itemKey: string, side: 'left' | 'right') => {
			dispatch(
				toggleItemKeySide({
					itemKey,
					side,
				})
			);
		},
		[dispatch]
	);

	const finishDrag = useCallback(() => {
		dragActiveRef.current = false;
		dragKeySv.value = '';
		dragHomeSv.value = null;
		dragTargetSv.value = null;
		draggingSv.value = 0;
		setDragItemKey(null);
		setScrollEnabled(true);
	}, [
		dragKeySv,
		dragHomeSv,
		dragTargetSv,
		draggingSv,
	]);

	const updateDragTarget = useCallback(
		(cloneTop: number) => {
			const layouts = layoutRef.current;
			const target = computeDropTarget(
				layouts,
				SECTION_HEADER_HEIGHT,
				ITEM_HEIGHT,
				cloneTop + ITEM_HEIGHT / 2
			);
			dragTargetSv.value = target;
			indicatorTopSv.value = getRowTop(
				layouts,
				target.side,
				target.index,
				SECTION_HEADER_HEIGHT,
				ITEM_HEIGHT
			);
		},
		[
			dragTargetSv,
			indicatorTopSv,
		]
	);

	const handleDragBegin = useCallback(
		(itemKey: string, side: DrawerSide, index: number) => {
			dragActiveRef.current = true;
			setScrollEnabled(false);
			dragKeySv.value = itemKey;
			setDragItemKey(itemKey);
			const rowTop = getRowTop(
				layoutRef.current,
				side,
				index,
				SECTION_HEADER_HEIGHT,
				ITEM_HEIGHT
			);
			dragStartYRef.current = rowTop;
			cloneTopSv.value = rowTop;
			dragHomeSv.value = { side, index };
			draggingSv.value = 1;
			updateDragTarget(rowTop);
		},
		[
			dragKeySv,
			dragHomeSv,
			draggingSv,
			cloneTopSv,
			updateDragTarget,
		]
	);

	const handleDragEnd = useCallback(
		(itemKey: string, homeSide: DrawerSide, translationY: number) => {
			dragActiveRef.current = false;
			const layouts = layoutRef.current;
			const releaseTop = dragStartYRef.current + translationY;
			const target = computeDropTarget(
				layouts,
				SECTION_HEADER_HEIGHT,
				ITEM_HEIGHT,
				releaseTop + ITEM_HEIGHT / 2
			);

			// Clear the live gap instantly — the layout re-render from the
			// dispatch below compensates the shift in the same frame, so the
			// rows stay visually in place.
			dragTargetSv.value = null;
			dragHomeSv.value = null;

			// The landing position must match the layout AFTER the move:
			// the moved row's slot in the target section is at its final
			// index, and when the home section lies above the target, the
			// whole target section shifts up by one item height (the home
			// section shrank).
			const homeLayout = layouts.find(({ side }) => side === homeSide);
			const targetLayout = layouts.find(({ side }) => side === target.side);
			let finalIndex = target.index;
			let landingTop = 0;
			if (target.side === homeSide) {
				finalIndex = Math.max(0, Math.min(finalIndex, (homeLayout?.itemCount ?? 1) - 1));
				landingTop = getRowTop(
					layouts,
					target.side,
					finalIndex,
					SECTION_HEADER_HEIGHT,
					ITEM_HEIGHT
				);
			} else {
				finalIndex = Math.max(0, Math.min(finalIndex, targetLayout?.itemCount ?? 0));
				landingTop =
					getRowTop(
						layouts,
						target.side,
						finalIndex,
						SECTION_HEADER_HEIGHT,
						ITEM_HEIGHT
					) - ((homeLayout?.top ?? 0) < (targetLayout?.top ?? 0) ? ITEM_HEIGHT : 0);
			}

			dispatch(
				moveItemKey({
					itemKey,
					side: target.side,
					index: target.index,
				})
			);

			cloneTopSv.value = withTiming(
				landingTop,
				{
					duration: DROP_ANIMATION_DURATION,
					easing: Easing.inOut(Easing.quad),
				},
				() => {
					runOnJS(finishDrag)();
				}
			);
		},
		[
			dispatch,
			finishDrag,
			cloneTopSv,
			dragTargetSv,
			dragHomeSv,
		]
	);

	const makeDragGesture = useCallback(
		(itemKey: string, side: DrawerSide, index: number) =>
			Gesture.Pan()
				.runOnJS(true)
				.minDistance(1)
				.activeOffsetY([-6, 6])
				.onBegin(() => handleDragBegin(itemKey, side, index))
				.onUpdate((event) => {
					const cloneTop = dragStartYRef.current + event.translationY;
					cloneTopSv.value = cloneTop;
					updateDragTarget(cloneTop);
				})
				.onEnd((event) => handleDragEnd(itemKey, side, event.translationY))
				.onFinalize(() => {
					// Cancelled drag (e.g. the scroll view took over) — reset
					// without dispatching a move.
					if (dragActiveRef.current) {
						finishDrag();
					}
				}),
		[
			handleDragBegin,
			handleDragEnd,
			finishDrag,
			cloneTopSv,
			updateDragTarget,
		]
	);

	const cloneStyle = useAnimatedStyle(() => ({
		opacity: draggingSv.value,
		transform: [{ translateY: cloneTopSv.value }],
	}));

	const indicatorStyle = useAnimatedStyle(() => {
		const home = dragHomeSv.value;
		const target = dragTargetSv.value;
		// Hidden while not dragging or when hovering the dragged item's own
		// slot (a drop there is a no-op).
		const isVisible =
			1 === draggingSv.value &&
			null !== target &&
			null !== home &&
			!('' === dragKeySv.value) &&
			!(target.side === home.side && target.index === home.index);
		return {
			opacity: isVisible ? 1 : 0,
			top: withTiming(indicatorTopSv.value, { duration: INDICATOR_ANIMATION_DURATION }),
		};
	});

	const dropIndicatorStyle = useDropIndicatorStyle();

	// One stable gesture instance per item — gestures are only recreated
	// when the item lists change, so an active drag never gets its gesture
	// replaced mid-way by a re-render.
	const gesturesByKey = useMemo(() => {
		const map: Record<string, ReturnType<typeof Gesture.Pan>> = {};
		SECTION_KEYS.forEach((side) => {
			itemKeysBySide[side].forEach((itemKey, index) => {
				map[itemKey] = makeDragGesture(itemKey, side, index);
			});
		});
		return map;
	}, [itemKeysBySide, makeDragGesture]);

	const renderItem = useCallback(
		(itemKey: string, side: DrawerSide, index: number) => (
			<View key={itemKey}>
				<Item
					itemKey={itemKey}
					side={side}
					index={index}
					isOnLeft={itemKeysBySide.left.includes(itemKey)}
					isOnRight={itemKeysBySide.right.includes(itemKey)}
					handleToggle={(toggleSide) => handleToggle(itemKey, toggleSide)}
					dragGesture={gesturesByKey[itemKey]}
					dragKeySv={dragKeySv}
					dragHomeSv={dragHomeSv}
					dragTargetSv={dragTargetSv}
				/>
			</View>
		),
		[
			itemKeysBySide,
			handleToggle,
			gesturesByKey,
			dragKeySv,
			dragHomeSv,
			dragTargetSv,
		]
	);

	return (
		<ModalWrapper
			visible={modalVisible}
			onDismiss={closeModal}
			headerLabel={t('drawers.drawer', { count: 0 })}
			scrollEnabled={scrollEnabled}
		>
			<View>
				{dragItemKey && (
					<Animated.View
						style={[
							styles.clone,
							{ width: sectionWidth },
							cloneStyle,
						]}
						pointerEvents="none"
					>
						<View
							style={[
								styles.cloneContent,
								{ backgroundColor: theme.colors.elevation.level2 },
							]}
						>
							<ItemContent itemKey={dragItemKey} />
						</View>
					</Animated.View>
				)}

				<Animated.View
					style={[
						styles.dropIndicator,
						{ width: sectionWidth },
						dropIndicatorStyle,
						indicatorStyle,
					]}
					pointerEvents="none"
				/>

				{SECTION_KEYS.map((side) => (
					<View key={side}>
						<View
							style={[
								styles.sectionHeader,
								{ width: sectionWidth },
								{ borderColor: theme.colors.outline },
								{ height: SECTION_HEADER_HEIGHT },
							]}
						>
							<Text style={styles.sectionHeaderLabel}>{sectionLabels[side]}</Text>
						</View>

						{itemKeysBySide[side].length === 0 && (
							<View
								style={[
									styles.sectionEmpty,
									{ width: sectionWidth },
								]}
							>
								<Text
									style={[
										styles.sectionEmptyHint,
										{ color: theme.colors.onSurfaceVariant },
									]}
								>
									{t('drawers.sectionEmpty')}
								</Text>
							</View>
						)}

						{itemKeysBySide[side].map((itemKey, index) =>
							renderItem(itemKey, side, index)
						)}
					</View>
				))}
			</View>
		</ModalWrapper>
	);
};

const styles = StyleSheet.create({
	itemRow: {
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		height: ITEM_HEIGHT,
		paddingHorizontal: 5,
	},
	itemCenter: {
		justifyContent: 'center',
		alignItems: 'center',
	},
	label: { marginTop: 4 },
	circleButton: {
		width: 28,
		height: 28,
		borderRadius: 14,
		borderWidth: 2,
		justifyContent: 'center',
		alignItems: 'center',
	},
	sectionHeader: {
		borderBottomWidth: 1,
		paddingHorizontal: 16,
		justifyContent: 'center',
	},
	sectionHeaderLabel: {
		fontWeight: 'bold',
	},
	sectionEmpty: {
		height: ITEM_HEIGHT,
		justifyContent: 'center',
		alignItems: 'center',
	},
	sectionEmptyHint: {
		fontStyle: 'italic',
	},
	clone: {
		position: 'absolute',
		top: 0,
		left: 0,
		zIndex: 10,
		elevation: 4,
	},
	cloneContent: {
		height: ITEM_HEIGHT,
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: 8,
	},
	dropIndicator: {
		position: 'absolute',
		top: 0,
		left: 0,
		height: ITEM_HEIGHT,
		zIndex: 9,
		elevation: 3,
	},
});

export default DrawerControlModal;
