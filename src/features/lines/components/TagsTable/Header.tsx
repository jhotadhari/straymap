/**
 * External dependencies
 */
import { FC, useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { sprintf } from 'sprintf-js';

/**
 * Internal dependencies
 */
import { tableStyles } from '../tableResources';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { selectTagsFilters, selectTagsFilterLogic } from '../../selectors';
import { setTagsFilterLogic, resetTagsFilters } from '../../slice';
import { getFilterKey, ColumnFilter } from '../../types';
import { detectFilterConflicts } from '../../db/filterConflicts';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import IconButtonHighlight from '../../../../components/generic/primitives/IconButtonHighlight';
import TagSelectColumns from './SelectColumns';
import TagFilterModals from './FilterModals';
import FilterBadge from '../FilterModals/FilterBadge';
import FilterConflictModal from '../FilterModals/FilterConflictModal';
import { OPACITY_DISABLED } from '../../../../constants';

const TagHeader: FC = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const dispatch = useAppDispatch();

	const filters = useAppSelector(selectTagsFilters);
	const filterLogic = useAppSelector(selectTagsFilterLogic);

	const [filterModalVisible, setFilterModalVisible] = useState(false);
	const [editFilter, setEditFilter] = useState<ColumnFilter | undefined>(undefined);
	const [conflictModalVisible, setConflictModalVisible] = useState(false);
	const hasFilters = filters.length > 0;
	const hasMultipleFilters = filters.length >= 2;

	const conflicts = useMemo(
		() => detectFilterConflicts(filters, filterLogic),
		[filters, filterLogic]
	);
	const hasConflicts = conflicts.length > 0 && filterLogic === 'and';

	const handleToggleFilterLogic = useCallback(() => {
		dispatch(setTagsFilterLogic(filterLogic === 'and' ? 'or' : 'and'));
	}, [dispatch, filterLogic]);

	const handleResetFilters = useCallback(() => {
		dispatch(resetTagsFilters());
	}, [dispatch]);

	const handleOpenNewFilter = useCallback(() => {
		setEditFilter(undefined);
		setFilterModalVisible(true);
	}, []);

	const handleOpenEditFilter = useCallback((filter: ColumnFilter) => {
		setEditFilter(filter);
		setFilterModalVisible(true);
	}, []);

	const handleDismissFilterModal = useCallback(() => {
		setFilterModalVisible(false);
		setEditFilter(undefined);
	}, []);

	const handleOpenConflictModal = useCallback(() => {
		setConflictModalVisible(true);
	}, []);

	const handleDismissConflictModal = useCallback(() => {
		setConflictModalVisible(false);
	}, []);

	const style = useMemo(
		() => [
			tableStyles.header,
			{
				borderColor: theme.colors.onBackground,
				flexDirection: 'column' as const,
			},
		],
		[theme]
	);

	const rowStyleFullWidth = useMemo(
		(): ViewStyle[] => [
			tableStyles.flexRowGap,
			{ alignItems: 'center', width: '100%' },
		],
		[]
	);

	const rowStyle = useMemo(() => [tableStyles.flexRowGap, { alignItems: 'center' as const }], []);

	const scrollStyle = useMemo(() => ({ flexShrink: 1, alignSelf: 'center' as const }), []);
	const scrollContentStyle = useMemo(() => ({ alignItems: 'center' as const }), []);
	const contentStyle = useMemo(() => ({ marginVertical: -2 }), []);
	const disabledIconStyle = useMemo(() => ({ opacity: OPACITY_DISABLED }), []);

	return (
		<View style={style}>
			<View style={rowStyleFullWidth}>
				<IconButtonHighlight
					icon="filter-plus-outline"
					size={20}
					onPress={handleOpenNewFilter}
					mode="outlined"
				/>

				{hasMultipleFilters && (
					<ButtonHighlight
						mode="outlined"
						compact
						onPress={handleToggleFilterLogic}
						contentStyle={contentStyle}
					>
						<Text>
							{sprintf(
								t('lines.filterLogic'),
								filterLogic === 'and'
									? t('lines.filterLogicAnd')
									: t('lines.filterLogicOr')
							)}
						</Text>
					</ButtonHighlight>
				)}

				{hasConflicts && (
					<IconButtonHighlight
						icon="alert-outline"
						size={20}
						onPress={handleOpenConflictModal}
						mode="outlined"
						iconColor={theme.colors.error}
					/>
				)}

				<View style={styles.spacer} />

				<TagSelectColumns />
			</View>

			{/* Filter badges row */}
			<View style={rowStyle}>
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					style={scrollStyle}
					contentContainerStyle={scrollContentStyle}
				>
					{hasFilters && (
						<View style={tableStyles.flexRowGap}>
							{filters.map((filter: ColumnFilter) => (
								<FilterBadge
									key={getFilterKey(filter)}
									filter={filter}
									onPress={() => handleOpenEditFilter(filter)}
								/>
							))}
						</View>
					)}
				</ScrollView>
				<IconButtonHighlight
					icon="filter-remove-outline"
					size={20}
					onPress={handleResetFilters}
					mode="outlined"
					disabled={!hasFilters}
					style={!hasFilters && disabledIconStyle}
				/>
			</View>

			<TagFilterModals
				visible={filterModalVisible}
				editFilter={editFilter}
				onDismiss={handleDismissFilterModal}
			/>

			<FilterConflictModal
				visible={conflictModalVisible}
				conflicts={conflicts}
				onDismiss={handleDismissConflictModal}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	spacer: { flex: 1 },
});

export default TagHeader;
