/**
 * External dependencies
 */
import { FC, memo, useCallback, useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme, Text } from 'react-native-paper';
import { get } from 'lodash-es';
import dayjs from '../../../../lib/dayjs';

/**
 * Internal dependencies
 */
import { Line, LineStats as LineStatsType, TableColumn } from '../../types';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import { useButtonProps } from '../../../../compose/useButtonProps';
import { DRAWER_ICON_SIZE } from '../../../drawers/constants';
import { cellConfigs, getCellCategory } from './sharedDeps';
import { tableStyles, useScrollSafePress } from '../tableResources';
import TagBadge from '../TagBadge';
import IconRouting from '../../../routing/drawerPanels/routing/IconComponent';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { setLineTemp } from '../../slice';
import { selectLinesTableColumns } from '../../selectors';
import { selectDateTimeFormat } from '../../../general/selectors';
import LineStat from '../Stats/LineStat';
import { RenderPart } from '../Stats/sharedDeps';
import IconFontGis from '../../../../components/generic/primitives/IconFontGis';
import IconCustom from '../../../../components/generic/primitives/IconCustom';

const OtherCell: FC<{
	cellKey: string;
	line: Omit<Line, 'geometry'>;
	style: StyleProp<ViewStyle>;
}> = memo(({ cellKey, line, style }) => {
	const cellStyle: StyleProp<ViewStyle> = useMemo(
		() => [
			style,
			{
				gap: 8,
				flexWrap: 'wrap',
				justifyContent: 'center',
				alignContent: 'center',
			},
		],
		[style]
	);
	switch (cellKey) {
		case 'tags':
			return (
				<View style={cellStyle}>
					{line.tags.map((tag) => (
						<TagBadge
							key={tag.id}
							tag={tag}
						/>
					))}
				</View>
			);
	}
	return undefined;
});
export interface TableRowProps {
	line: Omit<Line, 'geometry'>;
	styleCell: StyleProp<ViewStyle>;
	idx: number;
	isOnMap: boolean;
	handleRoutingBtnPress: (line: Omit<Line, 'geometry'>) => void;
	isChecked: boolean;
	toggleCheckedId: (id: number) => void;
	toggleOnMapId: (id: number) => void;
	isRoutingLine: boolean;
	stats?: LineStatsType;
	isFixedHeight?: boolean;
	rowHeight?: number;
}

const statsRenderParts = ['value'] as RenderPart[];

const TableRow: FC<TableRowProps> = memo(({
	line,
	styleCell,
	idx,
	handleRoutingBtnPress: handleRoutingBtnPress_,
	isChecked,
	isOnMap,
	toggleCheckedId,
	toggleOnMapId,
	isRoutingLine,
	stats: stats_,
	isFixedHeight,
	rowHeight,
}) => {
	const theme = useTheme();

	const buttonPropsText = useButtonProps({ mode: 'text' });

	const dispatch = useAppDispatch();

	const tableColumns: TableColumn[] = useAppSelector(selectLinesTableColumns);

	const dateTimeFormat = useAppSelector(selectDateTimeFormat);

	const visibleColumns = useMemo(
		() => tableColumns.filter((column) => column.visible),
		[tableColumns]
	);

	const toggleOnMap = useCallback(() => toggleOnMapId(line.id), [line.id, toggleOnMapId]);

	const toggleChecked = useCallback(() => {
		toggleCheckedId(line.id);
	}, [line.id, toggleCheckedId]);

	const responderProps = useScrollSafePress(toggleChecked);

	const style = useMemo(
		() => [
			tableStyles.flexRow,
			{
				...(isChecked && {
					...(idx % 2 === 1
						? {
								backgroundColor: theme.colors.inversePrimary,
							}
						: {
								backgroundColor: theme.colors.primaryContainer,
							}),
				}),
				...(isFixedHeight && {
					height: rowHeight,
					overflow: 'hidden' as const,
				}),
			},
		],
		[
			theme,
			idx,
			isChecked,
			isFixedHeight,
			rowHeight,
		]
	);

	const stats = stats_ ?? line.stats;

	const handleEditPress = useCallback(() => {
		dispatch(setLineTemp({ id: line.id }));
	}, [dispatch, line.id]);

	const handleRoutingBtnPress = useCallback(() => {
		handleRoutingBtnPress_(line);
	}, [handleRoutingBtnPress_, line]);

	const styleActionCell = useMemo(
		() => [
			styleCell,
			styles.actionsCell,
		],
		[styleCell]
	);

	return (
		<View style={style}>
			<View style={styleActionCell}>
				{!isRoutingLine ? (
					<ButtonHighlight
						{...buttonPropsText}
						onPress={toggleOnMap}
						compact={true}
					>
						<IconFontGis
							name={isOnMap ? 'map-rm' : 'map-add'}
							size={DRAWER_ICON_SIZE}
							color={
								isOnMap ? theme.colors.onBackground : theme.colors.onSurfaceDisabled
							}
						/>
					</ButtonHighlight>
				) : (
					<ButtonHighlight
						{...buttonPropsText}
						compact={true}
						onPress={handleRoutingBtnPress}
					>
						<IconRouting color={theme.colors.primary} />
					</ButtonHighlight>
				)}

				<ButtonHighlight
					{...buttonPropsText}
					onPress={handleEditPress}
					compact={true}
				>
					<IconCustom
						name="route_cog"
						size={DRAWER_ICON_SIZE}
						color={theme.colors.onBackground}
					/>
				</ButtonHighlight>
			</View>

			<View
				{...responderProps}
				style={tableStyles.flexRow}
			>
				{visibleColumns.map((column) => {
					const cellStyle = cellConfigs[column.key]?.style;
					const columnStyle = [
						styleCell,
						...(cellStyle ? [cellStyle] : []),
						{ padding: 4 },
					];
					switch (getCellCategory(column.key)) {
						case 'other':
							return (
								<OtherCell
									key={column.key}
									cellKey={column.key}
									line={line}
									style={columnStyle}
								/>
							);
						case 'stats':
							return (
								<View
									key={column.key}
									style={columnStyle}
								>
									{undefined !== get(stats, column.key) && (
										<LineStat
											columnKey={column.key}
											value={get(stats, column.key)}
											round={0}
											renderParts={statsRenderParts}
										/>
									)}
								</View>
							);
						default: {
							if (column.key === 'import_source_path') {
								const importData = (line.data as any)?.import as
									| { sourceFilePath?: string; trackIndexInFile?: number | null }
									| undefined;
								const label = importData?.sourceFilePath
									? `${importData.sourceFilePath}${importData.trackIndexInFile != null ? ` [${importData.trackIndexInFile + 1}]` : ''}`
									: undefined;
								return (
									<View
										key={column.key}
										style={columnStyle}
									>
										<Text numberOfLines={1} ellipsizeMode="head">
											{label}
										</Text>
									</View>
								);
							}
							const dateKeys = ['created_at', 'modified_at', 'custom_date'];
							const raw = get(line, column.key);
							const display =
								dateKeys.includes(column.key) && raw
									? dayjs(raw as string).format(dateTimeFormat)
									: raw;
							return (
								<View
									key={column.key}
									style={columnStyle}
								>
									<Text numberOfLines={isFixedHeight ? 1 : undefined}>
										{display}
									</Text>
								</View>
							);
						}
					}
				})}
			</View>
		</View>
	);
});

const styles = StyleSheet.create({
	actionsCell: {
		justifyContent: 'space-evenly',
		flexWrap: 'nowrap',
	},
});

export default TableRow;
