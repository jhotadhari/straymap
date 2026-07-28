/**
 * External dependencies
 */
import { FC, Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Sortable, { DragStartParams, SortableFlexDragEndParams } from 'react-native-sortables';

/**
 * Internal dependencies
 */
import ModalWrapper from '../../../../components/generic/wrapper/ModalWrapper';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { TableColumn } from '../../types';
import { selectLinesTableColumns } from '../../selectors';
import { setLinesTableColumns } from '../../slice';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import { useButtonProps } from '../../../../compose/useButtonProps';
import { Icon, Text } from 'react-native-paper';
import { DRAWER_ICON_SIZE, MODAL_PADDING, MODAL_WIDTH_FACTOR } from '../../../../constants';
import { sharedStyles } from '../../../../sharedStyles';
import { tableStyles } from '../tableResources';
import useDropIndicatorStyle from '../../../../compose/useDropIndicatorStyle';
import IconButtonHighlight from '../../../../components/generic/primitives/IconButtonHighlight';

const DraggableItem: FC<{
	column: TableColumn;
	isColumnVisible: boolean;
	toggleColumnVisible: () => void;
}> = ({ column, isColumnVisible, toggleColumnVisible }) => {
	const { t } = useTranslation();

	const buttonPropsText = useButtonProps({ mode: 'text' });

	const { width } = Dimensions.get('window');

	const style = useMemo(
		() => [
			styles.item,
			!isColumnVisible && sharedStyles.disabled,
			{
				width: width * MODAL_WIDTH_FACTOR - 2 * MODAL_PADDING,
			},
		],
		[
			isColumnVisible,
			width,
		]
	);

	return (
		<View style={style}>
			<Sortable.Handle
				mode="draggable"
				style={styles.handle}
			>
				<Text>{t(`lines.columns.${column.key}`)}</Text>
			</Sortable.Handle>

			<ButtonHighlight
				{...buttonPropsText}
				compact={true}
				onPress={toggleColumnVisible}
			>
				<Icon
					source={isColumnVisible ? 'eye-outline' : 'eye-off-outline'}
					size={DRAWER_ICON_SIZE}
				/>
			</ButtonHighlight>
		</View>
	);
};

const SelectColumns: FC<{}> = ({}) => {
	const { t } = useTranslation();

	const dispatch = useAppDispatch();

	const [isModalVisible, setIsModalVisible] = useState(false);

	const saveRef = useRef<undefined | (() => void)>(undefined);

	const tableColumns: TableColumn[] = useAppSelector(selectLinesTableColumns);

	const [scrollEnabled, setScrollEnabled] = useState(true);

	const [tableColumnsTemp, setTableColumnsTemp] = useState(tableColumns);

	useEffect(() => {
		saveRef.current = () => {
			dispatch(setLinesTableColumns(tableColumnsTemp));
		};
	}, [dispatch, tableColumnsTemp]);

	// Re-sync the working copy with the persisted columns whenever the modal opens.
	useEffect(() => {
		if (isModalVisible) {
			setTableColumnsTemp(tableColumns);
		}
	}, [isModalVisible, tableColumns]);

	const onDismiss = useCallback(() => {
		saveRef.current?.();
		setIsModalVisible(false);
	}, []);

	const dropIndicatorStyle = useDropIndicatorStyle();

	const handleOpenModal = useCallback(() => {
		setIsModalVisible(true);
	}, []);

	const handleDragStart = useCallback((_params: DragStartParams) => {
		setScrollEnabled(false);
	}, []);

	const handleDragEnd = useCallback(
		({ indexToKey }: SortableFlexDragEndParams) => {
			const newTableColumnsTemp: TableColumn[] = indexToKey
				.map((toKey) =>
					tableColumnsTemp.find((column) => column.key === toKey.replace('.$', ''))
				)
				.filter((column): column is TableColumn => !!column);

			setTableColumnsTemp(newTableColumnsTemp);
			setScrollEnabled(true);
		},
		[tableColumnsTemp]
	);

	return (
		<Fragment>
			<IconButtonHighlight
				icon="view-column-outline"
				size={20}
				onPress={handleOpenModal}
				mode="outlined"
			/>

			<ModalWrapper
				visible={isModalVisible}
				onDismiss={onDismiss}
				headerLabel={t('lines.selectColumns')}
				innerStyle={tableStyles.modalInner}
				scrollEnabled={scrollEnabled}
				modalStyle={styles.modal}
			>
				<Sortable.Flex
					itemEntering={null}
					gap={0}
					padding={0}
					sortEnabled={true}
					customHandle={true}
					showDropIndicator={true}
					dropIndicatorStyle={dropIndicatorStyle}
					flexDirection="column"
					reorderTriggerOrigin="center"
					alignItems="center"
					onDragStart={handleDragStart}
					onDragEnd={handleDragEnd}
				>
					{tableColumnsTemp.map((column: TableColumn) => {
						const toggleColumnVisible = () => {
							setTableColumnsTemp((prev) =>
								prev.map((col) =>
									col.key === column.key ? { ...col, visible: !col.visible } : col
								)
							);
						};
						return (
							<View key={column.key}>
								<DraggableItem
									column={column}
									isColumnVisible={column.visible}
									toggleColumnVisible={toggleColumnVisible}
								/>
							</View>
						);
					})}
				</Sortable.Flex>
			</ModalWrapper>
		</Fragment>
	);
};

const styles = StyleSheet.create({
	item: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		// width: '100%',
		paddingHorizontal: 8,
		paddingVertical: 8,
	},
	handle: {
		flexDirection: 'row',
		flexGrow: 1,
		gap: 16,
		alignItems: 'center',
	},
	modal: {
		overflow: 'visible',
	},
});

export default SelectColumns;
