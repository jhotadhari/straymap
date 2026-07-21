/**
 * External dependencies
 */
import { FC, useCallback, useEffect, useState } from 'react';

/**
 * Internal dependencies
 */
import {
	ColumnFilter,
	NumericColumnFilter,
	DateColumnFilter,
	StringColumnFilter,
	TagsColumnFilter,
} from '../../types';
import { FilterColumnType } from './sharedDeps';
import FilterNumericModal from './FilterNumericModal';
import FilterDateModal from './FilterDateModal';
import FilterStringModal from './FilterStringModal';
import FilterTagsModal from './FilterTagsModal';

interface FilterModalsOrchestratorProps {
	visible: boolean;
	editFilter?: ColumnFilter;
	initialColumnKey?: string;
	onDismiss: () => void;

	// Table-specific bindings
	filters: ColumnFilter[];
	upsertFilter: (filter: ColumnFilter) => void;
	removeFilter: (filter: ColumnFilter) => void;
	resolveFilterType: (columnKey: string) => FilterColumnType | undefined;
	ColumnSelectModal: FC<{
		visible: boolean;
		onDismiss: () => void;
		onSelectColumn: (columnKey: string) => void;
	}>;
}

type ModalStep = 'selectColumn' | 'editFilter';

const FilterModalsOrchestrator: FC<FilterModalsOrchestratorProps> = ({
	visible,
	editFilter,
	initialColumnKey,
	onDismiss,
	// filters no longer needed — numeric/date preload removed
	filters: _filters,
	upsertFilter,
	removeFilter,
	resolveFilterType,
	ColumnSelectModal,
}) => {
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
				setTempFilter(undefined);
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
	]);

	const handleSelectColumn = useCallback((columnKey: string) => {
		setSelectedColumnKey(columnKey);
		setStep('editFilter');
		// Always start fresh — numeric/date filters now support
		// multiple entries per column (min and max as separate
		// filters with distinct keys).
		setTempFilter(undefined);
	}, []);

	const handleDismiss = useCallback(() => {
		onDismiss();
	}, [onDismiss]);

	const handleSaveNumeric = useCallback(
		(filter: NumericColumnFilter) => {
			upsertFilter(filter);
		},
		[upsertFilter]
	);

	const handleSaveDate = useCallback(
		(filter: DateColumnFilter) => {
			upsertFilter(filter);
		},
		[upsertFilter]
	);

	const handleSaveString = useCallback(
		(filter: StringColumnFilter) => {
			upsertFilter(filter);
		},
		[upsertFilter]
	);

	const handleSaveTags = useCallback(
		(filter: TagsColumnFilter) => {
			upsertFilter(filter);
		},
		[upsertFilter]
	);

	const handleDelete = useCallback(() => {
		const filterToRemove = editFilter ?? tempFilter;
		if (filterToRemove) {
			removeFilter(filterToRemove);
		}
	}, [
		editFilter,
		tempFilter,
		removeFilter,
	]);

	const canDelete = !!(editFilter || tempFilter);

	const filterType = selectedColumnKey ? resolveFilterType(selectedColumnKey) : undefined;

	return (
		<>
			<ColumnSelectModal
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

export default FilterModalsOrchestrator;
