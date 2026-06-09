/**
 * External dependencies
 */
import { useQuery } from '@tanstack/react-query';
import { FC, useCallback, useMemo, useState, Dispatch, SetStateAction } from 'react';
import { ScrollView, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { useTheme, Text, Icon } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { queryRoutingLineId } from '../../routing/db/queries';
import { selectIsRouting } from '../../routing/selectors';
import { queryLines } from '../db/queries';
import { selectSelectedInfos } from '../selectors';
import { LineWithTags } from '../types';
import ButtonHighlight from '../../../../components/generic/ButtonHighlight';
import { iconSize } from '../../drawers/constants';
import { setLineSelected } from '../linesSlice';
import { without } from 'lodash-es';
import { sprintf } from 'sprintf-js';
import TagBadge from './TagBadge';
import LineStats from './LineStats';

const LineRow: FC<{
	line: LineWithTags;
	idx: number;
	routingLineId: number | null | undefined;
	visible: boolean;
	onMapIds: number[]; // ids of lines loaded on map.visible and invisible.
	checkedIds: number[];
	setCheckedIds: Dispatch<SetStateAction<number[]>>;
}> = ({ line, idx, routingLineId, visible, onMapIds, checkedIds, setCheckedIds }) => {
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
			styles.row,
			{
				...(!idx && { paddingTop: 8 }),
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

			<TouchableWithoutFeedback onPress={toggleChecked}>
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
			</TouchableWithoutFeedback>

			<View style={styles.noShrink}>
				{/* <ButtonHighlight
					mode="text"
					compact={true}
					onPress={toggleVisible}
				>
					<Icon
						source={visible ? 'eye-outline' : 'eye-off-outline'}
						size={iconSize}
					/>
				</ButtonHighlight> */}
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

const Header: FC<{
	checkedIds: number[];
}> = ({ checkedIds }) => {
	const theme = useTheme();

	const style = useMemo(
		() => [
			styles.header,
			{
				borderBottomColor: theme.colors.onBackground,
			},
		],
		[theme]
	);

	const labelStyle = useMemo(
		() => ({
			color: checkedIds.length ? theme.colors.onBackground : theme.colors.onSurfaceDisabled,
		}),
		[theme, checkedIds]
	);

	return (
		<View style={style}>
			<ButtonHighlight
				mode="text"
				compact={true}
				disabled={!checkedIds.length}
				onPress={() => {
					// ???
				}}
			>
				<Icon
					source={'square-edit-outline'}
					size={iconSize}
					color={checkedIds.length ? undefined : theme.colors.onSurfaceDisabled}
				/>
			</ButtonHighlight>

			<Text style={labelStyle}>
				{[
					'???Bulk actions',
					sprintf('%s selected???', checkedIds.length),
				].join(', ')}
			</Text>
		</View>
	);
};

const LinesList: FC = () => {
	const { t } = useTranslation();

	const dispatch = useAppDispatch();

	const theme = useTheme();

	const isRouting = useAppSelector(selectIsRouting);
	const { selectedIds: onMapIds, visibleMap } = useAppSelector(selectSelectedInfos);

	const { data: lines } = useQuery({
		queryKey: ['lines'],
		queryFn: () => queryLines(),
	});

	const { data: routingLineId } = useQuery({
		queryKey: ['routingLineId', isRouting],
		queryFn: () => queryRoutingLineId(isRouting),
	});

	const [checkedIds, setCheckedIds] = useState<number[]>([]);

	return (
		<View>
			<Header checkedIds={checkedIds} />

			<ScrollView>
				{lines?.map((line, idx) => (
					<LineRow
						key={line.id}
						line={line}
						routingLineId={routingLineId}
						idx={idx}
						onMapIds={onMapIds}
						checkedIds={checkedIds}
						setCheckedIds={setCheckedIds}
						visible={visibleMap[line.id]}
					/>
				))}
			</ScrollView>
		</View>
	);
};

const styles = StyleSheet.create({
	header: {
		flexDirection: 'row',
		justifyContent: 'flex-start',
		alignItems: 'center',
		minHeight: 8 * 8,
		paddingLeft: 8,
		paddingRight: 16,
		gap: 8,
		borderBottomWidth: 1,
	},
	noShrink: { flexShrink: 0 },
	row: {
		justifyContent: 'space-between',
		alignItems: 'center',
		flexDirection: 'row',
		paddingBottom: 4,
		paddingLeft: 8,
		paddingRight: 2,
		paddingTop: 4,
		gap: 8,
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

export default LinesList;
