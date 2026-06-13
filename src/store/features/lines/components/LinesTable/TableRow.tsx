/**
 * External dependencies
 */
import { FC, useCallback, useMemo, Dispatch, SetStateAction, useContext } from 'react';
import { StyleProp, TouchableWithoutFeedback, View, ViewStyle } from 'react-native';
import { useTheme, Text, Icon } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useQuery, WithRequired } from '@tanstack/react-query';
import { get, pick, without } from 'lodash-es';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { Line, LinePartial } from '../../types';
import ButtonHighlight from '../../../../../components/generic/ButtonHighlight';
import { iconSize } from '../../../drawers/constants';
import { setLineSelected } from '../../linesSlice';
import LineStats from '../LineStats';
import { lineCells, statsCells, otherCells, styles } from './sharedDeps';
import TagBadge from '../TagBadge';
import { selectIsRouting, selectStats } from '../../../routing/selectors';
import { queryRoutingLineId } from '../../../routing/db/queries';
import { setActiveKey } from '../../../drawers/drawersSlice';
import IconRouting from '../../../drawers/items/routing/IconComponent';
import { AppContext } from '../../../../../Context';
import { selectSideForKey } from '../../../drawers/selectors';
import { DrawerControl } from '../../../drawers/types';
import { setUiItemKeys } from '../../../ui/uiSlice';

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

const TableRow: FC<{
	line: Omit<Line, 'geometry'>;
	styleCell: StyleProp<ViewStyle>;
	idx: number;
	visible: boolean;
	onMapIds: number[]; // ids of lines loaded on map.visible and invisible.
	checkedIds: number[];
	setCheckedIds: Dispatch<SetStateAction<number[]>>;
}> = ({ line, styleCell, idx, visible, onMapIds, checkedIds, setCheckedIds }) => {
	const { t } = useTranslation();

	const dispatch = useAppDispatch();

	const theme = useTheme();

	const { drawerControlsRef } = useContext(AppContext);
	const drawerSideWithRouting = useAppSelector((state) => selectSideForKey(state, 'routing'));
	const handleRoutingBtnPress = useCallback(() => {
		if (drawerSideWithRouting) {
			dispatch(
				setActiveKey({
					activeKey: 'routing',
				})
			);
			(get(drawerControlsRef?.current, drawerSideWithRouting) as DrawerControl).expand(true);
			dispatch(setUiItemKeys([]));
		}
	}, [drawerSideWithRouting]);

	const routeId = useAppSelector(selectIsRouting);
	const { data: routingLineId } = useQuery({
		queryKey: ['routingLineId', routeId],
		queryFn: () => queryRoutingLineId(routeId),
	});

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

	const routingStats = useAppSelector(selectStats);
	const stats = line.id !== routingLineId ? line.stats : routingStats;

	return (
		<View style={style}>
			<View style={styleCell}>
				{line.id !== routingLineId && (
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

				{line.id === routingLineId && (
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
