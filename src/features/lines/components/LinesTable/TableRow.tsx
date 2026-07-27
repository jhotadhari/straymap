/**
 * External dependencies
 */
import { FC, useCallback, useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme, Text, Icon } from 'react-native-paper';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import { Line, LineStats as LineStatsType, TableColumn } from '../../types';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import { DRAWER_ICON_SIZE } from '../../../drawers/constants';
import { cellConfigs, getCellCategory } from './sharedDeps';
import { tableStyles, useScrollSafePress } from '../tableResources';
import TagBadge from '../TagBadge';
import IconRouting from '../../../routing/drawerPanels/routing/IconComponent';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { setLineTemp } from '../../slice';
import { selectLinesTableColumns } from '../../selectors';
import LineStat from '../Stats/LineStat';
import { RenderPart } from '../Stats/sharedDeps';
import IconFontGis from '../../../../components/generic/primitives/IconFontGis';

const OtherCell: FC<{
	cellKey: string;
	line: Omit<Line, 'geometry'>;
	style: StyleProp<ViewStyle>;
}> = ({ cellKey, line, style }) => {
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
};
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

const TableRow: FC<TableRowProps> = ({
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

	const dispatch = useAppDispatch();

	const tableColumns: TableColumn[] = useAppSelector(selectLinesTableColumns);

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

	return (
		<View style={style}>
			<View style={styleCell}>
				{!isRoutingLine && (
					<ButtonHighlight
						mode="text"
						compact={true}
						onPress={toggleOnMap}
					>
						<View style={styles.iconComponentWrapper}>
							<IconFontGis
								name={isOnMap ? 'map-rm' : 'map-add'}
								size={DRAWER_ICON_SIZE}
								color={
									isOnMap
										? theme.colors.onBackground
										: theme.colors.onSurfaceDisabled
								}
							/>
						</View>
					</ButtonHighlight>
				)}

				{isRoutingLine && (
					<ButtonHighlight
						mode="text"
						compact={true}
						onPress={handleRoutingBtnPress}
					>
						<IconRouting color={theme.colors.primary} />
					</ButtonHighlight>
				)}

				<ButtonHighlight
					mode="text"
					compact={true}
					onPress={handleEditPress}
				>
					<Icon
						source="cog"
						size={DRAWER_ICON_SIZE}
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
						default:
							return (
								<View
									key={column.key}
									style={columnStyle}
								>
									<Text numberOfLines={isFixedHeight ? 1 : undefined}>
										{get(line, column.key)}
									</Text>
								</View>
							);
					}
				})}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	iconComponentWrapper: {
		width: DRAWER_ICON_SIZE,
		height: DRAWER_ICON_SIZE,
		overflow: 'hidden',
		alignItems: 'center',
		justifyContent: 'center',
	},
});

export default TableRow;
