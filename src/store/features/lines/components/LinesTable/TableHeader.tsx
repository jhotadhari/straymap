/**
 * External dependencies
 */
import { FC, useMemo } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { sharedStyles, cellConfigs, getCellCategory } from './sharedDeps';
import { TableColumn } from '../../types';
import { useAppSelector } from '../../../../hooks';
import { selectTableColumns } from '../../selectors';

const TableHeader: FC<{
	styleCell: StyleProp<ViewStyle>;
}> = ({ styleCell }) => {
	const theme = useTheme();

	const { t } = useTranslation();

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

	return (
		<View style={styleContainer}>
			{/* empty placeholder for the column containing action buttons */}
			<View style={style} />

			{visibleColumns.map((column) => {
				const baseStyle = 'line' === getCellCategory(column.key) ? style : styleCell;
				const cellStyle = cellConfigs[column.key]?.style;
				return (
					<View
						key={column.key}
						style={cellStyle ? [baseStyle, cellStyle] : baseStyle}
					>
						<Text>{t(`lines.columns.${column.key}`)}</Text>
					</View>
				);
			})}
		</View>
	);
};

export default TableHeader;
