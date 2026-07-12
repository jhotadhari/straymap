/**
 * External dependencies
 */
import { FC } from 'react';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../../../hooks';
import { selectLinesFilters } from '../../../selectors';
import { upsertLinesFilter, removeLinesFilter } from '../../../slice';
import { getFilterColumnType } from '../sharedDeps';
import FilterColumnSelectModal from './FilterColumnSelectModal';
import FilterModalsOrchestrator from '../../FilterModals/FilterModalsOrchestrator';
import { ColumnFilter } from '../../../types';

interface LinesFilterModalsProps {
	visible: boolean;
	editFilter?: ColumnFilter;
	initialColumnKey?: string;
	onDismiss: () => void;
}

const LinesFilterModals: FC<LinesFilterModalsProps> = (props) => {
	const dispatch = useAppDispatch();
	const filters = useAppSelector(selectLinesFilters);

	return (
		<FilterModalsOrchestrator
			{...props}
			filters={filters}
			upsertFilter={(f) => dispatch(upsertLinesFilter(f))}
			removeFilter={(f) => dispatch(removeLinesFilter(f))}
			resolveFilterType={getFilterColumnType}
			ColumnSelectModal={FilterColumnSelectModal}
		/>
	);
};

export default LinesFilterModals;
