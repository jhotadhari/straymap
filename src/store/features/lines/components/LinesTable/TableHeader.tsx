/**
 * External dependencies
 */
import { FC, useCallback, useMemo } from 'react';
import { StyleProp, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { sharedStyles, cellConfigs, getCellCategory } from './sharedDeps';
import { TableColumn } from '../../types';
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { selectTableColumns, selectSort } from '../../selectors';
import { toggleSort } from '../../slice';

const SORT_ICON_SIZE = 16;

const TableHeader: FC<{
	styleCell: StyleProp<ViewStyle>;
}> = ({ styleCell }) => {
	const theme = useTheme();

	const { t } = useTranslation();

	const dispatch = useAppDispatch();

	const sort = useAppSelector(selectSort);

	const tableColumns: TableColumn[] = useAppSelector(selectTableColumns);

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

	const isSortable = useCallback((columnKey: string) => {
		return columnKey !== 'tags';
	}, []);

	const handleSortPress = useCallback(
		(columnKey: string) => {
			dispatch(toggleSort(columnKey));
		},
		[dispatch]
	);

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
						style={cellStyle ? [baseStyle, cellStyle] : baseStyle}
						onPress={sortable ? () => handleSortPress(column.key) : undefined}
						activeOpacity={sortable ? 0.6 : 1}
						disabled={!sortable}
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
		</View>
	);
};

export default TableHeader;
