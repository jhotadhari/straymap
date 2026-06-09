/**
 * External dependencies
 */
import { useQuery } from '@tanstack/react-query';
import { FC, useCallback, useMemo, ReactNode } from 'react';
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
import { selectSelectedIds } from '../selectors';
import { selectElementExpanded } from '../../ui/selectors';
import { setElementExpanded } from '../../ui/uiSlice';
import { LineWithTags, Tag } from '../types';
import ButtonHighlight from '../../../../components/generic/ButtonHighlight';
import { iconSize } from '../../drawers/constants';
import { selectUnitPrefs } from '../../general/selectors';
import { formatDistance, formatHeightDepth } from '../../../../lib/utils';
import { UnitPref } from '../../general/types';

const TagBadge: FC<{
	tag: Tag;
}> = ({ tag }) => {
	return (
		<View>
			<Text>{'???tag'}</Text>
		</View>
	);
};

const Stat: FC<{
	value: number;
	unitPrefKey: string;
	iconSource?: string;
}> = ({ value, unitPrefKey, iconSource }) => {
	const unitPrefs = useAppSelector(selectUnitPrefs);
	const formatted = useMemo(() => {
		switch (unitPrefKey) {
			case 'distance':
				return formatDistance(value, {
					...unitPrefs[unitPrefKey]!,
					round: 0,
				});
			case 'heightDepth':
				return formatHeightDepth(value, {
					...unitPrefs[unitPrefKey]!,
					round: 0,
				});
		}
	}, [
		unitPrefs[unitPrefKey],
		value,
		unitPrefKey,
	]);
	return (
		formatted &&
		formatted.length > 0 && (
			<View style={styles.stat}>
				{iconSource && (
					<Icon
						source={iconSource}
						size={16}
					/>
				)}
				<Text>{formatted}</Text>
			</View>
		)
	);
};

const LineRow: FC<{
	line: LineWithTags;
	idx: number;
	routingLineId: number | null | undefined;
}> = ({ line, idx, routingLineId }) => {
	const { t } = useTranslation();

	const dispatch = useAppDispatch();

	const theme = useTheme();

	const visible = true; // ???

	const colNodes = useMemo(() => {
		const nodes: ReactNode[] = [];

		// checked node
		nodes.push(
			<ButtonHighlight
				key="btn.checked"
				style={styles.noShrink}
				mode="text"
				compact={true}
				onPress={() => {
					// ???
				}}
			>
				<Icon
					source={'checkbox-outline'}
					size={iconSize}
				/>
			</ButtonHighlight>
		);

		// center node
		nodes.push(
			<View
				key="center"
				style={styles.rowColCenter}
			>
				<View style={styles.rowColCenterRow}>
					{line.title && <Text>{line.title}</Text>}
					<Text>{line.timestamp}</Text>
				</View>

				<View style={styles.rowColCenterRow}>
					<Stat
						value={line.stats.length}
						unitPrefKey="distance"
					/>
					<Stat
						value={line.stats.uphill}
						unitPrefKey="heightDepth"
						iconSource="arrow-up"
					/>
					<Stat
						value={line.stats.downhill}
						unitPrefKey="heightDepth"
						iconSource="arrow-down"
					/>
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
		);

		// controls node
		nodes.push(
			<View
				key="btn.visible"
				style={styles.noShrink}
			>
				<ButtonHighlight
					mode="text"
					compact={true}
					onPress={() => {
						// ???
					}}
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
		);

		return nodes;
	}, [
		t,
		line,
		routingLineId,
	]);

	const style: ViewStyle = useMemo(
		() => ({
			...(!idx && { paddingTop: 0 }),
			...(idx % 2 === 1 && { backgroundColor: theme.colors.surfaceDisabled }),
		}),
		[idx, theme]
	);
	return <View style={[styles.row, style]}>{colNodes}</View>;
};

const uiStateKey = 'selectedLinesDrawer';
const SelectedLinesList: FC = () => {
	const { t } = useTranslation();

	const dispatch = useAppDispatch();

	const theme = useTheme();

	const isRouting = useAppSelector(selectIsRouting);
	const selectedIds = useAppSelector(selectSelectedIds);

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
	stat: {
		flexDirection: 'row',
		alignItems: 'center',
		flexWrap: 'nowrap',
	},
});

export default SelectedLinesList;
