/**
 * External dependencies
 */
import { FC, useCallback, useEffect, useState } from 'react';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../../../hooks';
import { selectTagsFilters } from '../../../selectors';
import {
	ColumnFilter,
	NumericColumnFilter,
	DateColumnFilter,
	StringColumnFilter,
} from '../../../types';
import { upsertTagsFilter, removeTagsFilter } from '../../../slice';
import { getFilterColumnType } from '../sharedDeps';
import TagFilterColumnSelectModal from './FilterColumnSelectModal';
import FilterNumericModal from '../../LinesTable/FilterModals/FilterNumericModal';
import FilterDateModal from '../../LinesTable/FilterModals/FilterDateModal';
import FilterStringModal from '../../LinesTable/FilterModals/FilterStringModal';
import { selectTagsFilterableColumns } from '../../../selectors';

interface TagFilterModalsProps {
	visible: boolean;
	editFilter?: ColumnFilter;
	initialColumnKey?: string;
	onDismiss: () => void;
}

type ModalStep = 'selectColumn' | 'editFilter';

const TagFilterModals: FC<TagFilterModalsProps> = ({
	visible,
	editFilter,
	initialColumnKey,
	onDismiss,
}) => {
	const dispatch = useAppDispatch();
	const filters = useAppSelector(selectTagsFilters);

	const [step, setStep] = useState<ModalStep>('selectColumn');
	const [selectedColumnKey, setSelectedColumnKey] = useState<string | null>(null);
	const [tempFilter, setTempFilter] = useState<ColumnFilter | undefined>(undefined);

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
			dispatch(upsertTagsFilter(filter));
		},
		[dispatch]
	);

	const handleSaveDate = useCallback(
		(filter: DateColumnFilter) => {
			dispatch(upsertTagsFilter(filter));
		},
		[dispatch]
	);

	const handleSaveString = useCallback(
		(filter: StringColumnFilter) => {
			dispatch(upsertTagsFilter(filter));
		},
		[dispatch]
	);

	const handleDelete = useCallback(() => {
		const filterToRemove = editFilter ?? tempFilter;
		if (filterToRemove) {
			dispatch(removeTagsFilter(filterToRemove));
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
			<TagFilterColumnSelectModal
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
		</>
	);
};

export default TagFilterModals;
