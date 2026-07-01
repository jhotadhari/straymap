/**
 * External dependencies
 */
import { FC, useCallback, useEffect, useRef, useState } from 'react';

/**
 * Internal dependencies
 */
import { useAppDispatch } from '../../../../../hooks';
import {
	ColumnFilter,
	NumericColumnFilter,
	DateColumnFilter,
	StringColumnFilter,
} from '../../../types';
import { upsertFilter, removeFilter } from '../../../slice';
import { getFilterColumnType } from '../sharedDeps';
import FilterColumnSelectModal from './FilterColumnSelectModal';
import FilterNumericModal from './FilterNumericModal';
import FilterDateModal from './FilterDateModal';
import FilterStringModal from './FilterStringModal';

interface FilterModalsProps {
	visible: boolean;
	editFilter?: ColumnFilter; // existing filter to edit, undefined for new filter
	onDismiss: () => void;
}

type ModalStep = 'selectColumn' | 'editFilter';

const FilterModals: FC<FilterModalsProps> = ({ visible, editFilter, onDismiss }) => {
	const dispatch = useAppDispatch();

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
			} else {
				setSelectedColumnKey(null);
				setStep('selectColumn');
				setTempFilter(undefined);
			}
		}
	}, [visible, editFilter]);

	const handleSelectColumn = useCallback((columnKey: string) => {
		setSelectedColumnKey(columnKey);
		setStep('editFilter');
		setTempFilter(undefined);
	}, []);

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

	const handleDelete = useCallback(() => {
		if (selectedColumnKey) {
			dispatch(removeFilter(selectedColumnKey));
		}
	}, [dispatch, selectedColumnKey]);

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
					onDelete={editFilter ? handleDelete : undefined}
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
					onDelete={editFilter ? handleDelete : undefined}
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
					onDelete={editFilter ? handleDelete : undefined}
				/>
			)}
		</>
	);
};

export default FilterModals;
