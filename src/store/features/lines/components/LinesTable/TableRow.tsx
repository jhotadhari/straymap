/**
 * External dependencies
 */
import { FC, useCallback, useMemo, Dispatch, SetStateAction } from 'react';
import { StyleProp, TouchableWithoutFeedback, View, ViewStyle } from 'react-native';
import { useTheme, Text, Icon } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { useAppDispatch } from '../../../../hooks';
import { LineWithTags } from '../../types';
import ButtonHighlight from '../../../../../components/generic/ButtonHighlight';
import { iconSize } from '../../../drawers/constants';
import { setLineSelected } from '../../linesSlice';
import { get, pick, without } from 'lodash-es';
import LineStats from '../LineStats';
import { lineCells, statsCells, otherCells, styles } from './sharedDeps';
import TagBadge from '../TagBadge';

const OtherCell: FC<{
	cellKey: string;
	line: LineWithTags;
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

const TableRow: FC<{
	line: LineWithTags;
	styleCell: StyleProp<ViewStyle>;
	idx: number;
	routingLineId: number | null | undefined;
	visible: boolean;
	onMapIds: number[]; // ids of lines loaded on map.visible and invisible.
	checkedIds: number[];
	setCheckedIds: Dispatch<SetStateAction<number[]>>;
}> = ({ line, styleCell, idx, routingLineId, visible, onMapIds, checkedIds, setCheckedIds }) => {
	const { t } = useTranslation();

	const dispatch = useAppDispatch();

	const theme = useTheme();

	const isOnMap = useMemo(() => onMapIds.includes(line.id), [onMapIds, line.id]);

	const isChecked = useMemo(() => checkedIds.includes(line.id), [checkedIds, line.id]);

	// const toggleVisible = useCallback(() => dispatch(setLineVisible(line.id)), [line.id]);

	const toggleOnMap = useCallback(() => dispatch(setLineSelected(line.id)), [line.id]);

	const toggleChecked = useCallback(() => {
		if (checkedIds.includes(line.id)) {
			setCheckedIds(without(checkedIds, line.id));
		} else {
			setCheckedIds([...checkedIds, line.id]);
		}
	}, [line.id, checkedIds]);

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

	return (
		<View style={style}>
			<View style={styleCell}>
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
							{undefined !== get(line.stats, key) && (
								<LineStats
									stats={pick(line.stats, key)}
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
