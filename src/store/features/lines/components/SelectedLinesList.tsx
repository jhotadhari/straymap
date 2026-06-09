/**
 * External dependencies
 */
import { useQuery } from '@tanstack/react-query';
import { FC, useCallback, useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { List, useTheme, Text, Icon } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { queryRoutingLineId } from '../../routing/db/queries';
import { selectIsRouting } from '../../routing/selectors';
import { queryLines } from '../db/queries';
import { selectSelectedInfos } from '../selectors';
import { selectElementExpanded } from '../../ui/selectors';
import { setElementExpanded } from '../../ui/uiSlice';
import { LineWithTags } from '../types';
import ButtonHighlight from '../../../../components/generic/ButtonHighlight';
import { iconSize } from '../../drawers/constants';
import { setLineSelected, setLineVisible } from '../linesSlice';
import LineStats from './LineStats';
import TagBadge from './TagBadge';

const LineRow: FC<{
	line: LineWithTags;
	idx: number;
	routingLineId: number | null | undefined;
	visible: boolean;
}> = ({ line, idx, routingLineId, visible }) => {
	const { t } = useTranslation();

	const dispatch = useAppDispatch();

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

	return (
		<View style={[styles.row, style]}>
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

			<View style={styles.rowColCenter}>
				<View style={styles.rowColCenterRow}>
					{line.title && <Text>{line.title}</Text>}
					<Text>{line.timestamp}</Text>
				</View>

				<View style={styles.rowColCenterRow}>
					<LineStats line={line} />
				</View>

				{line.tags.length > 0 && (
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

	const isRouting = useAppSelector(selectIsRouting);
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

	const { data: lines } = useQuery({
		queryKey: ['lines', selectedIds],
		queryFn: () => queryLines(selectedIds),
	});

	const { data: routingLineId } = useQuery({
		queryKey: ['routingLineId', isRouting],
		queryFn: () => queryRoutingLineId(isRouting),
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
					{lines?.map((line, idx) => (
						<LineRow
							key={line.id}
							line={line}
							routingLineId={routingLineId}
							idx={idx}
							visible={visibleMap[line.id]}
						/>
					))}
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
