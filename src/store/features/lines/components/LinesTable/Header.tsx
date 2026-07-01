/**
 * External dependencies
 */
import { FC, useCallback, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { sharedStyles } from './sharedDeps';
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { selectFilters, selectFilterLogic } from '../../selectors';
import { setFilterLogic } from '../../slice';
import ButtonHighlight from '../../../../../components/generic/ButtonHighlight';
import IconButtonHighlight from '../../../../../components/generic/IconButtonHighlight';
import SelectColumns from './SelectColumns';
import FilterModals from './FilterModals';
import FilterBadge from './FilterModals/FilterBadge';
import { ColumnFilter } from '../../types';

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

	const showAndOrToggle = hasMultipleFilters;

	const handleToggleFilterLogic = useCallback(() => {
		dispatch(setFilterLogic(filterLogic === 'and' ? 'or' : 'and'));
	}, [dispatch, filterLogic]);

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
			},
		],
		[theme]
	);

	const filterRowStyle = useMemo(
		() => [
			sharedStyles.flexRowGap,
			{ flexShrink: 1, alignSelf: 'center' as const },
		],
		[]
	);

	return (
		<View style={style}>
			<View style={filterRowStyle}>
				{/* Add filter button */}
				<IconButtonHighlight
					icon="filter-plus-outline"
					size={20}
					onPress={handleOpenNewFilter}
					mode='outlined'
				/>

				{/* AND/OR toggle */}
				{showAndOrToggle && (
					<ButtonHighlight
						mode='outlined'
						compact={true}
						onPress={handleToggleFilterLogic}
					>
						<Text>
							{filterLogic === 'and'
								? t('lines.filterLogicAnd')
								: t('lines.filterLogicOr')}
						</Text>
					</ButtonHighlight>
				)}

				{/* Filter badges (scrollable if many) */}
				{hasFilters && (
					<ScrollView
						horizontal={true}
						showsHorizontalScrollIndicator={false}
						style={{ flexShrink: 1, alignSelf: 'center' as const }}
						contentContainerStyle={{ alignItems: 'center' as const }}
					>
						<View style={sharedStyles.flexRowGap}>
							{filters.map((filter) => (
								<FilterBadge
									key={filter.columnKey}
									filter={filter}
									onPress={() => handleOpenEditFilter(filter)}
								/>
							))}
						</View>
					</ScrollView>
				)}
			</View>

			<SelectColumns/>

			<FilterModals
				visible={filterModalVisible}
				editFilter={editFilter}
				onDismiss={handleDismissFilterModal}
			/>
		</View>
	);
};

export default Header;
