/**
 * External dependencies
 */
import { FC, RefObject, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleProp, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import Popover, { PopoverPlacement } from 'react-native-popover-view';

/**
 * Internal dependencies
 */
import { sharedStyles, cellConfigs, getCellCategory, getFilterColumnType } from './sharedDeps';
import { TableColumn } from '../../types';
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { selectTableColumns, selectSort, selectFilters } from '../../selectors';
import { toggleSort, setTableColumns, setSort, removeFilter } from '../../slice';
import MenuItem from '../../../../../components/generic/MenuItem';
import { ColumnHeaderMenuContext } from './Context';

const SORT_ICON_SIZE = 16;

const TableHeader: FC<{
	styleCell: StyleProp<ViewStyle>;
}> = ({ styleCell }) => {
	const theme = useTheme();

	const { t } = useTranslation();

	const dispatch = useAppDispatch();

	const sort = useAppSelector(selectSort);
	const filters = useAppSelector(selectFilters);

	const tableColumns: TableColumn[] = useAppSelector(selectTableColumns);

	const { openFilterForColumn } = useContext(ColumnHeaderMenuContext);

	const visibleColumns = useMemo(
		() => tableColumns.filter((column) => column.visible),
		[tableColumns]
	);

	const style: StyleProp<ViewStyle> = useMemo(
		() => [
			styleCell,
			{
				height: 50,
			},
		],
		[styleCell]
	);

	const styleContainer: StyleProp<ViewStyle> = useMemo(
		() => [
			sharedStyles.flexRow,
			{
				backgroundColor: theme.colors.background,
				borderBottomWidth: 1,
				borderColor: theme.colors.onBackground,
			},
		],
		[theme]
	);

	// ── Column header popover ─────────────────────────────────────────────

	const [menuVisible, setMenuVisible] = useState(false);
	const [activeColumnKey, setActiveColumnKey] = useState<string | null>(null);

	const dismissMenu = useCallback(() => {
		setMenuVisible(false);
		setActiveColumnKey(null);
	}, []);

	// Per-column stable ref objects for popover anchoring.
	// We store the raw views and build RefObject wrappers on demand
	// to avoid type conflicts with React.createRef in this RN version.
	const columnViewsRef = useRef<Map<string, View | null>>(new Map());

	const getColumnAnchorRef = useCallback((key: string): RefObject<View> => {
		const view = columnViewsRef.current.get(key) ?? null;
		return { current: view } as RefObject<View>;
	}, []);

	const isSortable = useCallback((columnKey: string) => {
		return columnKey !== 'tags';
	}, []);

	const columnHasFilters = useCallback(
		(columnKey: string) => {
			return filters.some((f) => f.columnKey === columnKey);
		},
		[filters]
	);

	const handleSortPress = useCallback(
		(columnKey: string) => {
			dispatch(toggleSort(columnKey));
		},
		[dispatch]
	);

	const handleLongPress = useCallback((columnKey: string) => {
		setActiveColumnKey(columnKey);
		setMenuVisible(true);
	}, []);

	const handleHideColumn = useCallback(() => {
		if (!activeColumnKey) return;
		dispatch(
			setTableColumns(
				tableColumns.map((col) =>
					col.key === activeColumnKey ? { ...col, visible: false } : col
				)
			)
		);
		dismissMenu();
	}, [
		activeColumnKey,
		tableColumns,
		dispatch,
		dismissMenu,
	]);

	const handleSortAsc = useCallback(() => {
		if (!activeColumnKey) return;
		dispatch(setSort({ columnKey: activeColumnKey, direction: 'asc' }));
		dismissMenu();
	}, [
		activeColumnKey,
		dispatch,
		dismissMenu,
	]);

	const handleSortDesc = useCallback(() => {
		if (!activeColumnKey) return;
		dispatch(setSort({ columnKey: activeColumnKey, direction: 'desc' }));
		dismissMenu();
	}, [
		activeColumnKey,
		dispatch,
		dismissMenu,
	]);

	const handleAddFilter = useCallback(() => {
		if (!activeColumnKey) return;
		openFilterForColumn(activeColumnKey);
		dismissMenu();
	}, [
		activeColumnKey,
		openFilterForColumn,
		dismissMenu,
	]);

	const handleRemoveFilter = useCallback(() => {
		if (!activeColumnKey) return;
		const columnFilters = filters.filter((f) => f.columnKey === activeColumnKey);
		columnFilters.forEach((f) => dispatch(removeFilter(f)));
		dismissMenu();
	}, [
		activeColumnKey,
		filters,
		dispatch,
		dismissMenu,
	]);

	const popoverStyle = useMemo(
		() => ({
			backgroundColor: theme.colors.background,
			borderWidth: 1,
			borderColor: theme.colors.outline,
			minWidth: 150,
		}),
		[theme]
	);

	const activeAnchorRef = activeColumnKey ? getColumnAnchorRef(activeColumnKey) : undefined;

	const activeColumnSupportsSort = activeColumnKey ? isSortable(activeColumnKey) : false;
	const activeColumnSupportsFilter = activeColumnKey
		? !!getFilterColumnType(activeColumnKey)
		: false;
	const activeColumnHasFilters = activeColumnKey ? columnHasFilters(activeColumnKey) : false;

	return (
		<View style={styleContainer}>
			{/* empty placeholder for the column containing action buttons */}
			<View style={style} />

			{visibleColumns.map((column) => {
				const baseStyle = 'line' === getCellCategory(column.key) ? style : styleCell;
				const cellStyle = cellConfigs[column.key]?.style;
				const sortable = isSortable(column.key);
				const isActiveSort = sort?.columnKey === column.key;
				const sortIcon = isActiveSort
					? sort?.direction === 'asc'
						? 'arrow-up'
						: 'arrow-down'
					: undefined;

				return (
					<TouchableOpacity
						key={column.key}
						ref={(view: View | null) => {
							columnViewsRef.current.set(column.key, view);
						}}
						style={cellStyle ? [baseStyle, cellStyle] : baseStyle}
						onPress={sortable ? () => handleSortPress(column.key) : undefined}
						onLongPress={() => handleLongPress(column.key)}
						activeOpacity={sortable ? 0.6 : 1}
					>
						<Text>{t(`lines.columns.${column.key}`)}</Text>
						{sortIcon && (
							<Icon
								source={sortIcon}
								size={SORT_ICON_SIZE}
							/>
						)}
					</TouchableOpacity>
				);
			})}

			{activeAnchorRef && (
				<Popover
					popoverStyle={popoverStyle}
					arrowSize={arrowSize}
					isVisible={menuVisible}
					placement={PopoverPlacement.BOTTOM}
					onRequestClose={dismissMenu}
					from={activeAnchorRef as RefObject<React.Component<{}, {}, any>>}
					animationConfig={animationConfig}
				>
					<ScrollView>
						{menuVisible && (
							<View>
								<MenuItem
									leadingIcon="eye-off-outline"
									onPress={handleHideColumn}
									title={t('lines.columnMenu.hideColumn')}
								/>

								{activeColumnSupportsSort && (
									<MenuItem
										leadingIcon="arrow-up"
										onPress={handleSortAsc}
										title={t('lines.columnMenu.sortAsc')}
									/>
								)}

								{activeColumnSupportsSort && (
									<MenuItem
										leadingIcon="arrow-down"
										onPress={handleSortDesc}
										title={t('lines.columnMenu.sortDesc')}
									/>
								)}

								{activeColumnSupportsFilter && (
									<MenuItem
										leadingIcon="filter-plus-outline"
										onPress={handleAddFilter}
										title={t('lines.columnMenu.addFilter')}
									/>
								)}

								{activeColumnHasFilters && (
									<MenuItem
										leadingIcon="filter-remove-outline"
										onPress={handleRemoveFilter}
										title={t('lines.columnMenu.removeFilter')}
									/>
								)}
							</View>
						)}
					</ScrollView>
				</Popover>
			)}
		</View>
	);
};

const animationConfig = {
	duration: 0,
};
const arrowSize = { height: 0, width: 0 };

export default TableHeader;
