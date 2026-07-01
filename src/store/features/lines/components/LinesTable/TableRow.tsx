/**
 * External dependencies
 */
import { FC, useCallback, useMemo } from 'react';
import { StyleProp, TouchableWithoutFeedback, View, ViewStyle } from 'react-native';
import { useTheme, Text, Icon } from 'react-native-paper';
import { get, pick } from 'lodash-es';

/**
 * Internal dependencies
 */
import { Line, LineStats as LineStatsType, TableColumn } from '../../types';
import ButtonHighlight from '../../../../../components/generic/ButtonHighlight';
import { DRAWER_ICON_SIZE } from '../../../drawers/constants';
import LineStats from '../LineStats';
import { cellConfigs, sharedStyles, getCellCategory } from './sharedDeps';
import TagBadge from '../TagBadge';
import IconRouting from '../../../drawers/items/routing/IconComponent';
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { setLineTemp } from '../../slice';
import { selectTableColumns } from '../../selectors';

const OtherCell: FC<{
	cellKey: string;
	line: Omit<Line, 'geometry'>;
	style: StyleProp<ViewStyle>;
}> = ({ cellKey, line, style }) => {
	const cellStyle = useMemo(() => [style, { gap: 16 }], [style]);
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
	handleRoutingBtnPress: () => void;
	isChecked: boolean;
	toggleCheckedId: (id: number) => void;
	toggleOnMapId: (id: number) => void;
	isRoutingLine: boolean;
	stats?: LineStatsType;
}

const TableRow: FC<TableRowProps> = ({
	line,
	styleCell,
	idx,
	handleRoutingBtnPress,
	isChecked,
	isOnMap,
	toggleCheckedId,
	toggleOnMapId,
	isRoutingLine,
	stats: stats_,
}) => {
	const theme = useTheme();

	const dispatch = useAppDispatch();

	const tableColumns: TableColumn[] = useAppSelector(selectTableColumns);

	const visibleColumns = useMemo(
		() => tableColumns.filter((column) => column.visible),
		[tableColumns]
	);

	const toggleOnMap = useCallback(() => toggleOnMapId(line.id), [line.id, toggleOnMapId]);

	const toggleChecked = useCallback(() => {
		toggleCheckedId(line.id);
	}, [line.id, toggleCheckedId]);

	const style = useMemo(
		() => [
			sharedStyles.flexRow,
			{
				...(idx % 2 === 1 && {
					backgroundColor: theme.colors.surfaceDisabled,
				}),
				...(isChecked && {
					...(idx % 2 === 1
						? {
								backgroundColor: theme.colors.inversePrimary,
							}
						: {
								backgroundColor: theme.colors.primaryContainer,
							}),
				}),
			},
		],
		[
			theme,
			idx,
			isChecked,
		]
	);

	const stats = stats_ ?? line.stats;

	const handleEditPress = useCallback(() => {
		dispatch(setLineTemp({ id: line.id }));
	}, [dispatch, line.id]);

	return (
		<View style={style}>
			<View style={styleCell}>
				{!isRoutingLine && (
					<ButtonHighlight
						mode="text"
						compact={true}
						onPress={toggleOnMap}
					>
						<Icon
							source={isOnMap ? 'map-check' : 'map'}
							size={DRAWER_ICON_SIZE}
							color={isOnMap ? undefined : theme.colors.onSurfaceDisabled}
						/>
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

			<TouchableWithoutFeedback onPress={toggleChecked}>
				<View style={sharedStyles.flexRow}>
					{visibleColumns.map((column) => {
						const cellStyle = cellConfigs[column.key]?.style;
						const columnStyle = cellStyle ? [styleCell, cellStyle] : styleCell;

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
											<LineStats
												stats={pick(stats, column.key)}
												round={0}
												plain={true}
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
										<Text>{get(line, column.key)}</Text>
									</View>
								);
						}
					})}
				</View>
			</TouchableWithoutFeedback>
		</View>
	);
};

export default TableRow;
