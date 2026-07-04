/**
 * External dependencies
 */
import { FC, useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { sharedStyles } from './sharedDeps';
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { selectFilters, selectFilterLogic } from '../../selectors';
import { setFilterLogic, resetFilters } from '../../slice';
import ButtonHighlight from '../../../../../components/generic/ButtonHighlight';
import IconButtonHighlight from '../../../../../components/generic/IconButtonHighlight';
import SelectColumns from './SelectColumns';
import FilterModals from './FilterModals';
import FilterBadge from './FilterModals/FilterBadge';
import { ColumnFilter } from '../../types';
import { sprintf } from 'sprintf-js';

const Header: FC = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const dispatch = useAppDispatch();

	const filters = useAppSelector(selectFilters);
	const filterLogic = useAppSelector(selectFilterLogic);

	const [filterModalVisible, setFilterModalVisible] = useState(false);
	const [editFilter, setEditFilter] = useState<ColumnFilter | undefined>(undefined);

	const hasFilters = filters.length > 0;
	const hasMultipleFilters = filters.length >= 2;

	const handleToggleFilterLogic = useCallback(() => {
		dispatch(setFilterLogic(filterLogic === 'and' ? 'or' : 'and'));
	}, [dispatch, filterLogic]);

	const handleResetFilters = useCallback(() => {
		dispatch(resetFilters());
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

	const style = useMemo(
		() => [
			sharedStyles.header,
			{
				borderColor: theme.colors.onBackground,
				flexDirection: 'column' as const,
			},
		],
		[theme]
	);

	const rowStyleFullWidth = useMemo(
		() => [sharedStyles.flexRowGap, { alignItems: 'center' as const, width: '100%' }],
		[]
	);

	const rowStyle = useMemo(
		() => [sharedStyles.flexRowGap, { alignItems: 'center' as const }],
		[]
	);

	const scrollStyle = useMemo(() => ({ flexShrink: 1, alignSelf: 'center' as const }), []);

	const scrollContentStyle = useMemo(() => ({ alignItems: 'center' as const }), []);

	const disabledLabelStyle = useMemo(() => ({ opacity: 0.5 }), []);
	const disabledIconStyle = useMemo(() => ({ opacity: 0.5 }), []);

	return (
		<View style={style}>
			{/* Row 1: reset filters, AND/OR toggle, column selector */}
			<View style={rowStyleFullWidth}>
				<IconButtonHighlight
					icon="filter-plus-outline"
					size={20}
					onPress={handleOpenNewFilter}
					mode="outlined"
				/>

				<ButtonHighlight
					mode="outlined"
					compact={true}
					onPress={handleToggleFilterLogic}
					disabled={!hasMultipleFilters}
					labelStyle={!hasMultipleFilters && disabledLabelStyle}
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

				<View style={styles.spacer} />

				<SelectColumns />
			</View>

			{/* Row 2: filter badges + remove filter button */}
			<View style={rowStyle}>
				<ScrollView
					horizontal={true}
					showsHorizontalScrollIndicator={false}
					style={scrollStyle}
					contentContainerStyle={scrollContentStyle}
				>
					{hasFilters && (
						<View style={sharedStyles.flexRowGap}>
							{filters.map((filter) => (
								<FilterBadge
									key={filter.columnKey}
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

			<FilterModals
				visible={filterModalVisible}
				editFilter={editFilter}
				onDismiss={handleDismissFilterModal}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	spacer: { flex: 1 },
});

export default Header;
