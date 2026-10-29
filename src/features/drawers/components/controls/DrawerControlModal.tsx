/**
 * External dependencies
 */
import { Dimensions, StyleSheet, TouchableHighlight, View } from 'react-native';
import { Dispatch, FC, SetStateAction, useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon, Text, useTheme } from 'react-native-paper';
import { get } from 'lodash-es';
import Sortable, { DragStartParams, SortableFlexDragEndParams } from 'react-native-sortables';

/**
 * Internal dependencies
 */
import { featureRegistry } from '../../../FeatureRegistry';
import ModalWrapper from '../../../../components/generic/wrapper/ModalWrapper';
import { DrawerPanel, DrawerSide } from '../../types';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { selectItemKeys } from '../../selectors';
import { setItemKeys, toggleItemKeySide } from '../../slice';
import { DRAWER_ICON_SIZE } from '../../constants';
import { MODAL_PADDING, MODAL_WIDTH_FACTOR } from '../../../../constants';
import useDropIndicatorStyle from '../../../../compose/useDropIndicatorStyle';
import {
	DrawerSideItemKeys,
	getSectionEmptyKey,
	getSectionHeaderKey,
	getSectionSpacerEndKey,
	getSectionSpacerStartKey,
	resolveDragEndSections,
} from '../../utils';

const SECTION_KEYS: DrawerSide[] = [
	'left',
	'right',
	'available',
];

// Height of the invisible boundary spacers. They absorb the library's
// compaction shift next to the fixed-order headers, so real items never
// visually cross a section divider while dragging.
const SECTION_SPACER_HEIGHT = 10;

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
	isOnLeft: boolean;
	isOnRight: boolean;
	handleToggle: (side: 'left' | 'right') => void;
	width: number;
}> = ({ itemKey, isOnLeft, isOnRight, handleToggle, width }) => {
	return (
		<View style={[styles.itemRow, { width }]}>
			<CircleButton
				checked={isOnLeft}
				onPress={() => handleToggle('left')}
			/>

			<Sortable.Handle
				mode="draggable"
				style={styles.itemCenter}
			>
				<ItemContent itemKey={itemKey} />
			</Sortable.Handle>

			<CircleButton
				checked={isOnRight}
				onPress={() => handleToggle('right')}
			/>
		</View>
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

	const itemKeysBySide: DrawerSideItemKeys = useMemo(
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

	// Pre-drag snapshot for the drag-end reconstruction — refreshed every
	// render so the gesture callbacks always see the current lists.
	const dragInfoRef = useRef<{ key: string; preSides: DrawerSideItemKeys } | null>(null);

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

	const handleDragStart = useCallback(
		(event: DragStartParams) => {
			dragInfoRef.current = {
				// SortableFlex appends '.$' to keys during drag; strip it back to the original key
				key: event.key.replace('.$', ''),
				preSides: {
					left: [...itemKeysBySide.left],
					right: [...itemKeysBySide.right],
					available: [...itemKeysBySide.available],
				},
			};
			setScrollEnabled(false);
		},
		[itemKeysBySide]
	);

	const handleDragEnd = useCallback(
		({ indexToKey }: SortableFlexDragEndParams) => {
			setScrollEnabled(true);
			const dragInfo = dragInfoRef.current;
			if (!dragInfo) {
				return;
			}
			// Strip the '.$' suffix, drop placeholder sentinels, split by the
			// header sentinels, and move items displaced across a fixed header
			// back to their pre-drag section.
			const sides = resolveDragEndSections({
				preSides: dragInfo.preSides,
				order: indexToKey.map((toKey) => toKey.replace('.$', '')),
				draggedKey: dragInfo.key,
			});
			SECTION_KEYS.forEach((side) => {
				dispatch(
					setItemKeys({
						side,
						itemKeys: sides[side],
					})
				);
			});
		},
		[dispatch]
	);

	const dropIndicatorStyle = useDropIndicatorStyle();

	const renderSpacer = useCallback(
		(key: string, width: number) => (
			<View key={key}>
				<Sortable.Handle mode="non-draggable">
					<View
						style={[styles.sectionSpacer, { width, height: SECTION_SPACER_HEIGHT }]}
					/>
				</Sortable.Handle>
			</View>
		),
		[]
	);

	const renderItem = useCallback(
		(itemKey: string) => (
			<View key={itemKey}>
				<Item
					itemKey={itemKey}
					width={sectionWidth}
					isOnLeft={itemKeysBySide.left.includes(itemKey)}
					isOnRight={itemKeysBySide.right.includes(itemKey)}
					handleToggle={(side) => handleToggle(itemKey, side)}
				/>
			</View>
		),
		[
			itemKeysBySide,
			handleToggle,
			sectionWidth,
		]
	);

	return (
		<ModalWrapper
			visible={modalVisible}
			onDismiss={closeModal}
			headerLabel={t('drawers.drawer', { count: 0 })}
			scrollEnabled={scrollEnabled}
		>
			<Sortable.Flex
				itemEntering={null}
				gap={0}
				padding={0}
				sortEnabled
				customHandle
				showDropIndicator
				dropIndicatorStyle={dropIndicatorStyle}
				flexDirection="column"
				flexWrap="nowrap"
				reorderTriggerOrigin="center"
				alignItems="center"
				onDragStart={handleDragStart}
				onDragEnd={handleDragEnd}
			>
				{SECTION_KEYS.flatMap((side) => [
					<View key={getSectionHeaderKey(side)}>
						<Sortable.Handle mode="fixed-order">
							<View
								style={[
									styles.sectionHeader,
									{ width: sectionWidth },
									{ borderColor: theme.colors.outline },
								]}
							>
								<Text style={styles.sectionHeaderLabel}>{sectionLabels[side]}</Text>
							</View>
						</Sortable.Handle>
					</View>,
					renderSpacer(getSectionSpacerStartKey(side), sectionWidth),
					...(itemKeysBySide[side].length > 0
						? [
								...itemKeysBySide[side].map((itemKey) => renderItem(itemKey)),
								renderSpacer(getSectionSpacerEndKey(side), sectionWidth),
							]
						: [
								<View key={getSectionEmptyKey(side)}>
									<Sortable.Handle mode="non-draggable">
										<View
											style={[styles.sectionEmpty, { width: sectionWidth }]}
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
									</Sortable.Handle>
								</View>,
								renderSpacer(getSectionSpacerEndKey(side), sectionWidth),
							]),
				])}
			</Sortable.Flex>
		</ModalWrapper>
	);
};

const styles = StyleSheet.create({
	itemRow: {
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 5,
		margin: 5,
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
		paddingVertical: 8,
		paddingHorizontal: 16,
	},
	sectionHeaderLabel: {
		fontWeight: 'bold',
	},
	sectionEmpty: {
		justifyContent: 'center',
		alignItems: 'center',
		paddingVertical: 8,
	},
	sectionEmptyHint: {
		fontStyle: 'italic',
	},
	sectionSpacer: {
		backgroundColor: 'transparent',
	},
});

export default DrawerControlModal;
