/**
 * External dependencies
 */
import { FC } from 'react';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../../../store/hooks';
import { selectTagsFilters } from '../../../selectors';
import { upsertTagsFilter, removeTagsFilter } from '../../../slice';
import { getFilterColumnType } from '../sharedDeps';
import TagFilterColumnSelectModal from './FilterColumnSelectModal';
import FilterModalsOrchestrator from '../../FilterModals/FilterModalsOrchestrator';
import { ColumnFilter } from '../../../types';

interface TagFilterModalsProps {
	visible: boolean;
	editFilter?: ColumnFilter;
	initialColumnKey?: string;
	onDismiss: () => void;
}

const TagFilterModals: FC<TagFilterModalsProps> = (props) => {
	const dispatch = useAppDispatch();
	const filters = useAppSelector(selectTagsFilters);

	return (
		<FilterModalsOrchestrator
			{...props}
			filters={filters}
			upsertFilter={(f) => dispatch(upsertTagsFilter(f))}
			removeFilter={(f) => dispatch(removeTagsFilter(f))}
			resolveFilterType={getFilterColumnType}
			ColumnSelectModal={TagFilterColumnSelectModal}
		/>
	);
};

export default TagFilterModals;
