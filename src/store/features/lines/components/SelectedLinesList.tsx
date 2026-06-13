/**
 * External dependencies
 */
import { useQuery } from '@tanstack/react-query';
import { FC, useCallback, useContext, useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { List, useTheme, Text, Icon } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { get, omit, pick } from 'lodash-es';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { queryRoutingLineId } from '../../routing/db/queries';
import { selectIsRouting, selectStats } from '../../routing/selectors';
import { selectSelectedInfos } from '../selectors';
import { selectElementExpanded } from '../../ui/selectors';
import { setElementExpanded } from '../../ui/slice';
import { Line } from '../types';
import ButtonHighlight from '../../../../components/generic/ButtonHighlight';
import { iconSize } from '../../drawers/constants';
import { setLineSelected, setLineVisible } from '../slice';
import LineStats from './LineStats';
import TagBadge from './TagBadge';
import { setActiveKey } from '../../drawers/slice';
import IconRouting from '../../drawers/items/routing/IconComponent';
import { selectSideForKey } from '../../drawers/selectors';
import { AppContext } from '../../../../Context';
import { DrawerControl } from '../../drawers/types';
import { FetchLinesParams } from '../db/fetch';
import { queryLines } from '../db/queries';

const LineRow: FC<{
	line: Omit<Line, 'geometry'>;
	idx: number;
	visible: boolean;
}> = ({ line, idx, visible }) => {
	const { t } = useTranslation();

	const dispatch = useAppDispatch();

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
		}
	}, [drawerSideWithRouting]);

	const theme = useTheme();

	const style: ViewStyle = useMemo(
		() => ({
			...(!idx && { paddingTop: 0 }),
			...(idx % 2 === 1 && { backgroundColor: theme.colors.surfaceDisabled }),
		}),
		[idx, theme]
	);

	const toggleVisible = useCallback(() => dispatch(setLineVisible(line.id)), [line.id]);

	const toggleSelected = useCallback(() => dispatch(setLineSelected(line.id)), [line.id]);

	const routeId = useAppSelector(selectIsRouting);
	const { data: routingLineId } = useQuery({
		queryKey: ['routingLineId', routeId],
		queryFn: () => queryRoutingLineId(routeId),
	});

	const routingStats = useAppSelector(selectStats);
	const stats = (line.id !== routingLineId ? line?.stats : routingStats) ?? {};

	return (
		<View style={[styles.row, style]}>
			{line.id !== routingLineId && (
				<ButtonHighlight
					style={styles.noShrink}
					mode="text"
					compact={true}
					onPress={toggleSelected}
				>
					<Icon
						source={'undo'}
						size={iconSize}
					/>
				</ButtonHighlight>
			)}

			{line.id === routingLineId && (
				<ButtonHighlight
					style={styles.noShrink}
					mode="text"
					compact={true}
					onPress={handleRoutingBtnPress}
				>
					<IconRouting color={theme.colors.primary} />
				</ButtonHighlight>
			)}

			<View style={styles.rowColCenter}>
				<View style={styles.rowColCenterRow}>
					{line.title && <Text>{line.title}</Text>}
					<Text>{line.timestamp}</Text>
				</View>

				<View style={styles.rowColCenterRow}>
					<LineStats
						stats={omit(stats, ['minZ', 'maxZ'])}
						round={0}
					/>
				</View>
				<View style={styles.rowColCenterRow}>
					<LineStats
						stats={pick(stats, ['minZ', 'maxZ'])}
						round={0}
					/>
				</View>

				{line?.tags && line?.tags.length > 0 && (
					<View style={styles.rowColCenterRow}>
						{line.tags.map((tag) => (
							<TagBadge
								key={tag.id}
								tag={tag}
							/>
						))}
					</View>
				)}
			</View>

			<View style={styles.noShrink}>
				<ButtonHighlight
					mode="text"
					compact={true}
					onPress={toggleVisible}
					disabled={line.id === routingLineId}
					style={line.id === routingLineId ? { opacity: 0.5 } : undefined}
				>
					<Icon
						source={visible ? 'eye-outline' : 'eye-off-outline'}
						size={iconSize}
					/>
				</ButtonHighlight>
				<ButtonHighlight
					mode="text"
					compact={true}
					onPress={() => {
						// ???
					}}
				>
					<Icon
						source={'cog'}
						size={iconSize}
					/>
				</ButtonHighlight>
			</View>
		</View>
	);
};

const uiStateKey = 'selectedLinesDrawer';
const SelectedLinesList: FC = () => {
	const { t } = useTranslation();

	const dispatch = useAppDispatch();

	const theme = useTheme();

	const { selectedIds, visibleMap } = useAppSelector(selectSelectedInfos);

	const notExpanded = useAppSelector((state) => selectElementExpanded(state, uiStateKey));

	const handleAccordionPress = useCallback(() => {
		dispatch(
			setElementExpanded({
				key: uiStateKey,
				expanded: !notExpanded,
			})
		);
	}, [
		notExpanded,
		uiStateKey,
	]);

	const linesQueryParams: FetchLinesParams = useMemo(
		() => ({
			lineIds: selectedIds,
			fieldsExclude: ['geometry'],
		}),
		[selectedIds]
	);

	const { data: lines } = useQuery({
		queryKey: ['linesMeta', selectedIds],
		queryFn: () => queryLines(linesQueryParams) as Promise<Omit<Line, 'geometry'>[]>,
	});

	return (
		<View>
			<List.Accordion
				title={t('???SelectedLines', { count: 0 })}
				expanded={!notExpanded}
				onPress={handleAccordionPress}
				titleStyle={theme.fonts.bodyMedium}
				containerStyle={{ marginRight: -12 }}
			>
				<View>
					{lines?.map((line, idx) => {
						return (
							<LineRow
								key={line.id}
								line={line}
								idx={idx}
								visible={visibleMap[line.id]}
							/>
						);
					})}
				</View>
			</List.Accordion>
		</View>
	);
};

const styles = StyleSheet.create({
	noShrink: { flexShrink: 0 },
	row: {
		justifyContent: 'space-between',
		alignItems: 'center',
		flexDirection: 'row',
		paddingBottom: 4,
		paddingLeft: 4,
		paddingRight: 2,
		paddingTop: 4,
	},
	rowColCenter: {
		flexShrink: 1,
		gap: 8,
		width: '100%',
	},
	rowColCenterRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
	},
});

export default SelectedLinesList;
