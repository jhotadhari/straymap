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
import { Line, LineStats as LineStatsType } from '../../types';
import ButtonHighlight from '../../../../../components/generic/ButtonHighlight';
import { iconSize } from '../../../drawers/constants';
import LineStats from '../LineStats';
import { lineCells, statsCells, otherCells, styles } from './sharedDeps';
import TagBadge from '../TagBadge';
import IconRouting from '../../../drawers/items/routing/IconComponent';

const OtherCell: FC<{
	cellKey: string;
	line: Omit<Line, 'geometry'>;
	style: StyleProp<ViewStyle>;
}> = ({ cellKey, line, style }) => {
	const cellStyle = useMemo(() => [style, { gap: 16 }], []);
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

	const toggleOnMap = useCallback(() => toggleOnMapId(line.id), [line.id]);

	const toggleChecked = useCallback(() => {
		toggleCheckedId(line.id);
	}, [line.id, toggleCheckedId]);

	const style = useMemo(
		() => [
			styles.flexRow,
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
			theme,
			isChecked,
		]
	);

	const stats = stats_ ?? line.stats;

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
							size={iconSize}
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
					// onPress={toggleOnMap}
				>
					<Icon
						source="cog"
						size={iconSize}
					/>
				</ButtonHighlight>
			</View>

			<TouchableWithoutFeedback onPress={toggleChecked}>
				<View style={styles.flexRow}>
					{Object.keys(lineCells).map((key) => (
						<View
							key={key}
							style={
								lineCells[key]?.style
									? [styleCell, lineCells[key]?.style]
									: styleCell
							}
						>
							<Text>{get(line, key)}</Text>
						</View>
					))}

					{Object.keys(otherCells).map((key) => (
						<OtherCell
							key={key}
							cellKey={key}
							line={line}
							style={
								otherCells[key]?.style
									? [styleCell, otherCells[key]?.style]
									: styleCell
							}
						/>
					))}

					{Object.keys(statsCells).map((key) => (
						<View
							key={key}
							style={
								statsCells[key]?.style
									? [styleCell, statsCells[key]?.style]
									: styleCell
							}
						>
							{undefined !== get(stats, key) && (
								<LineStats
									stats={pick(stats, key)}
									round={0}
									plain={true}
								/>
							)}
						</View>
					))}
				</View>
			</TouchableWithoutFeedback>
		</View>
	);
};

export default TableRow;
