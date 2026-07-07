/**
 * External dependencies
 */
import { FC, useCallback, useEffect, useState } from 'react';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../../../hooks';
import { selectFilters } from '../../../selectors';
import {
	ColumnFilter,
	NumericColumnFilter,
	DateColumnFilter,
	StringColumnFilter,
	TagsColumnFilter,
} from '../../../types';
import { upsertFilter, removeFilter } from '../../../slice';
import { getFilterColumnType } from '../sharedDeps';
import FilterColumnSelectModal from './FilterColumnSelectModal';
import FilterNumericModal from './FilterNumericModal';
import FilterDateModal from './FilterDateModal';
import FilterStringModal from './FilterStringModal';
import FilterTagsModal from './FilterTagsModal';

interface FilterModalsProps {
	visible: boolean;
	editFilter?: ColumnFilter; // existing filter to edit, undefined for new filter
	initialColumnKey?: string; // skip column selection, go directly to edit step for this column
	onDismiss: () => void;
}

type ModalStep = 'selectColumn' | 'editFilter';

const FilterModals: FC<FilterModalsProps> = ({
	visible,
	editFilter,
	initialColumnKey,
	onDismiss,
}) => {
	const dispatch = useAppDispatch();
	const filters = useAppSelector(selectFilters);

	const [step, setStep] = useState<ModalStep>('selectColumn');
	const [selectedColumnKey, setSelectedColumnKey] = useState<string | null>(null);
	const [tempFilter, setTempFilter] = useState<ColumnFilter | undefined>(undefined);

	// Reset state when modal opens
	useEffect(() => {
		if (visible) {
			if (editFilter) {
				setSelectedColumnKey(editFilter.columnKey);
				setStep('editFilter');
				setTempFilter(editFilter);
			} else if (initialColumnKey) {
				setSelectedColumnKey(initialColumnKey);
				setStep('editFilter');
				const filterType = getFilterColumnType(initialColumnKey);
				if (filterType === 'numeric' || filterType === 'date') {
					const existing = filters.find((f) => f.columnKey === initialColumnKey);
					setTempFilter(existing);
				} else {
					setTempFilter(undefined);
				}
			} else {
				setSelectedColumnKey(null);
				setStep('selectColumn');
				setTempFilter(undefined);
			}
		}
	}, [
		visible,
		editFilter,
		initialColumnKey,
		filters,
	]);

	const handleSelectColumn = useCallback(
		(columnKey: string) => {
			setSelectedColumnKey(columnKey);
			setStep('editFilter');

			const filterType = getFilterColumnType(columnKey);
			// For single-filter column types, preload the existing filter
			// so the modal opens in edit mode.  Multi-filter types always
			// start fresh.
			if (filterType === 'numeric' || filterType === 'date') {
				const existing = filters.find((f) => f.columnKey === columnKey);
				setTempFilter(existing);
			} else {
				setTempFilter(undefined);
			}
		},
		[filters]
	);

	const handleDismiss = useCallback(() => {
		onDismiss();
	}, [onDismiss]);

	const handleSaveNumeric = useCallback(
		(filter: NumericColumnFilter) => {
			dispatch(upsertFilter(filter));
		},
		[dispatch]
	);

	const handleSaveDate = useCallback(
		(filter: DateColumnFilter) => {
			dispatch(upsertFilter(filter));
		},
		[dispatch]
	);

	const handleSaveString = useCallback(
		(filter: StringColumnFilter) => {
			dispatch(upsertFilter(filter));
		},
		[dispatch]
	);

	const handleSaveTags = useCallback(
		(filter: TagsColumnFilter) => {
			dispatch(upsertFilter(filter));
		},
		[dispatch]
	);

	const handleDelete = useCallback(() => {
		const filterToRemove = editFilter ?? tempFilter;
		if (filterToRemove) {
			dispatch(removeFilter(filterToRemove));
		}
	}, [
		dispatch,
		editFilter,
		tempFilter,
	]);

	const canDelete = !!(editFilter || tempFilter);

	const filterType = selectedColumnKey ? getFilterColumnType(selectedColumnKey) : undefined;

	return (
		<>
			<FilterColumnSelectModal
				visible={visible && step === 'selectColumn'}
				onDismiss={handleDismiss}
				onSelectColumn={handleSelectColumn}
			/>

			{selectedColumnKey && filterType === 'numeric' && (
				<FilterNumericModal
					key={selectedColumnKey}
					visible={visible && step === 'editFilter'}
					columnKey={selectedColumnKey}
					existingFilter={
						(editFilter ?? tempFilter)?.type === 'numeric'
							? ((editFilter ?? tempFilter) as NumericColumnFilter)
							: undefined
					}
					onDismiss={handleDismiss}
					onSave={handleSaveNumeric}
					onDelete={canDelete ? handleDelete : undefined}
				/>
			)}

			{selectedColumnKey && filterType === 'date' && (
				<FilterDateModal
					key={selectedColumnKey}
					visible={visible && step === 'editFilter'}
					columnKey={selectedColumnKey}
					existingFilter={
						(editFilter ?? tempFilter)?.type === 'date'
							? ((editFilter ?? tempFilter) as DateColumnFilter)
							: undefined
					}
					onDismiss={handleDismiss}
					onSave={handleSaveDate}
					onDelete={canDelete ? handleDelete : undefined}
				/>
			)}

			{selectedColumnKey && filterType === 'string' && (
				<FilterStringModal
					key={selectedColumnKey}
					visible={visible && step === 'editFilter'}
					columnKey={selectedColumnKey}
					existingFilter={
						(editFilter ?? tempFilter)?.type === 'string'
							? ((editFilter ?? tempFilter) as StringColumnFilter)
							: undefined
					}
					onDismiss={handleDismiss}
					onSave={handleSaveString}
					onDelete={canDelete ? handleDelete : undefined}
				/>
			)}

			{selectedColumnKey && filterType === 'tags' && (
				<FilterTagsModal
					key={selectedColumnKey}
					visible={visible && step === 'editFilter'}
					columnKey={selectedColumnKey}
					existingFilter={
						(editFilter ?? tempFilter)?.type === 'tags'
							? ((editFilter ?? tempFilter) as TagsColumnFilter)
							: undefined
					}
					onDismiss={handleDismiss}
					onSave={handleSaveTags}
					onDelete={canDelete ? handleDelete : undefined}
				/>
			)}
		</>
	);
};

export default FilterModals;
