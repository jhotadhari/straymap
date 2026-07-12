/**
 * External dependencies
 */
import { FC } from 'react';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../../../hooks';
import { selectFilters } from '../../../selectors';
import { upsertFilter, removeFilter } from '../../../slice';
import { getFilterColumnType } from '../sharedDeps';
import FilterColumnSelectModal from './FilterColumnSelectModal';
import FilterModalsOrchestrator from '../../FilterModals/FilterModalsOrchestrator';
import { ColumnFilter } from '../../../types';

interface FilterModalsProps {
	visible: boolean;
	editFilter?: ColumnFilter;
	initialColumnKey?: string;
	onDismiss: () => void;
}

const FilterModals: FC<FilterModalsProps> = (props) => {
	const dispatch = useAppDispatch();
	const filters = useAppSelector(selectFilters);

	return (
		<FilterModalsOrchestrator
			{...props}
			filters={filters}
			upsertFilter={(f) => dispatch(upsertFilter(f))}
			removeFilter={(f) => dispatch(removeFilter(f))}
			resolveFilterType={getFilterColumnType}
			ColumnSelectModal={FilterColumnSelectModal}
		/>
	);
};

export default FilterModals;
