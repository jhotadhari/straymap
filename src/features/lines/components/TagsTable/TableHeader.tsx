/**
 * External dependencies
 */
import { FC, RefObject, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleProp, View, ViewStyle } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import Popover, { PopoverPlacement } from 'react-native-popover-view';

/**
 * Internal dependencies
 */
import { cellConfigs, getFilterColumnType } from './sharedDeps';
import { useScrollSafePress } from '../tableResources';
import { tableStyles } from '../tableResources';
import { TableColumn } from '../../types';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { selectTagsTableColumns, selectTagsSort, selectTagsFilters } from '../../selectors';
import { toggleTagsSort, setTagsTableColumns, setTagsSort, removeTagsFilter } from '../../slice';
import MenuItem from '../../../../components/generic/wrapper/MenuItem';
import IconButtonHighlight from '../../../../components/generic/primitives/IconButtonHighlight';
import { ColumnHeaderMenuContext } from './Context';

const SORT_ICON_SIZE = 16;

const SortableHeaderCell: FC<{
	columnKey: string;
	sortable: boolean;
	isActiveSort: boolean;
	sortIcon: string | undefined;
	cellStyle: StyleProp<ViewStyle>;
	onSortPress: (columnKey: string) => void;
	onLongPress: (columnKey: string) => void;
	onRef: (view: View | null) => void;
	t: (key: string) => string;
}> = ({
	columnKey,
	sortable,
	isActiveSort,
	sortIcon,
	cellStyle,
	onSortPress,
	onLongPress,
	onRef,
	t,
}) => {
	const handlePress = useCallback(() => onSortPress(columnKey), [onSortPress, columnKey]);
	const scrollSafeResponderProps = useScrollSafePress(handlePress);

	const handleLongPress = useCallback(() => onLongPress(columnKey), [onLongPress, columnKey]);

	return (
		<View
			ref={onRef}
			style={cellStyle}
			{...(sortable ? scrollSafeResponderProps : {})}
			// @ts-expect-error — onLongPress exists on View but the TS types
			// shipped with this RN version don't include it.
			onLongPress={handleLongPress}
		>
			<Text>{t(`lines.columns.${columnKey}`)}</Text>
			{sortIcon && (
				<Icon
					source={sortIcon}
					size={SORT_ICON_SIZE}
				/>
			)}
		</View>
	);
};

const TagTableHeader: FC<{
	styleCell: StyleProp<ViewStyle>;
	onCreatePress: () => void;
}> = ({ styleCell, onCreatePress }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const dispatch = useAppDispatch();

	const sort = useAppSelector(selectTagsSort);
	const filters = useAppSelector(selectTagsFilters);
	const tableColumns: TableColumn[] = useAppSelector(selectTagsTableColumns);

	const { openFilterForColumn } = useContext(ColumnHeaderMenuContext);

	const visibleColumns = useMemo(
		() => tableColumns.filter((column) => column.visible),
		[tableColumns]
	);

	const containerMinWidth = useMemo(() => {
		const actionCol = 100;
		const visible = tableColumns.filter((c) => c.visible);
		const colsWidth = visible.reduce(
			(sum, c) => sum + ((cellConfigs as any)[c.key]?.style?.width ?? 100),
			0
		);
		return actionCol + colsWidth;
	}, [tableColumns]);

	const style: StyleProp<ViewStyle> = useMemo(
		() => [
			styleCell,
			{ height: 50 },
		],
		[styleCell]
	);

	const styleContainer: StyleProp<ViewStyle> = useMemo(
		() => [
			tableStyles.flexRow,
			{
				backgroundColor: theme.colors.background,
				borderBottomWidth: 1,
				borderColor: theme.colors.onBackground,
				minWidth: containerMinWidth,
			},
		],
		[theme, containerMinWidth]
	);

	// ── Column header popover ─────────────────────────────────────────────

	const [menuVisible, setMenuVisible] = useState(false);
	const [activeColumnKey, setActiveColumnKey] = useState<string | null>(null);

	const dismissMenu = useCallback(() => {
		setMenuVisible(false);
		setActiveColumnKey(null);
	}, []);

	const columnViewsRef = useRef<Map<string, View | null>>(new Map());

	const getColumnAnchorRef = useCallback((key: string): RefObject<View> => {
		const view = columnViewsRef.current.get(key) ?? null;
		return { current: view } as RefObject<View>;
	}, []);

	const isSortable = useCallback((columnKey: string) => {
		return columnKey !== 'color';
	}, []);

	const columnHasFilters = useCallback(
		(columnKey: string) => {
			return filters.some((f) => f.columnKey === columnKey);
		},
		[filters]
	);

	const handleSortPress = useCallback(
		(columnKey: string) => {
			dispatch(toggleTagsSort(columnKey));
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
			setTagsTableColumns(
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
		dispatch(setTagsSort({ columnKey: activeColumnKey, direction: 'asc' }));
		dismissMenu();
	}, [
		activeColumnKey,
		dispatch,
		dismissMenu,
	]);

	const handleSortDesc = useCallback(() => {
		if (!activeColumnKey) return;
		dispatch(setTagsSort({ columnKey: activeColumnKey, direction: 'desc' }));
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
		columnFilters.forEach((f) => dispatch(removeTagsFilter(f)));
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
			{/* Create button column */}
			<View style={style}>
				<IconButtonHighlight
					icon="plus"
					mode="outlined"
					size={20}
					onPress={onCreatePress}
				/>
			</View>

			{visibleColumns.map((column) => {
				const cellStyle = cellConfigs[column.key]?.style
					? [styleCell, cellConfigs[column.key]?.style]
					: styleCell;
				const sortable = isSortable(column.key);
				const isActiveSort = sort?.columnKey === column.key;
				const sortIcon = isActiveSort
					? sort?.direction === 'asc'
						? 'arrow-up'
						: 'arrow-down'
					: undefined;

				return (
					<SortableHeaderCell
						key={column.key}
						columnKey={column.key}
						sortable={sortable}
						isActiveSort={isActiveSort}
						sortIcon={sortIcon}
						cellStyle={cellStyle}
						onSortPress={handleSortPress}
						onLongPress={handleLongPress}
						onRef={(view: View | null) => {
							columnViewsRef.current.set(column.key, view);
						}}
						t={t}
					/>
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

export default TagTableHeader;
