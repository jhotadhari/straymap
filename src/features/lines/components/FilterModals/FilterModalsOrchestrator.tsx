/**
 * External dependencies
 */
import { FC, memo, useCallback, useEffect, useState } from 'react';

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

	// Reset internal state when the modal closes, so the next open starts
	// fresh (no stale step/column from the previous session).
	useEffect(() => {
		if (!visible) {
			setStep('selectColumn');
			setSelectedColumnKey(null);
			setTempFilter(undefined);
		}
	}, [visible]);

	// Auto-dismiss when editing a filter whose column has no resolvable
	// filter type (e.g. a legacy persisted filter). Without this the modal
	// would render nothing while `visible` stays true, leaving the UI stuck.
	useEffect(() => {
		if (visible && editFilter && !resolveFilterType(editFilter.columnKey)) {
			onDismiss();
		}
	}, [
		visible,
		editFilter,
		resolveFilterType,
		onDismiss,
	]);

	// Derive the active step/column synchronously from the incoming props
	// while the modal is open. Using an effect for this caused a one-frame
	// render with stale state — the wrong modal (or none) flashed open and
	// then closed.
	const activeStep: ModalStep = editFilter || initialColumnKey ? 'editFilter' : step;
	const activeColumnKey: string | null =
		editFilter?.columnKey ?? initialColumnKey ?? selectedColumnKey;

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

	const filterType = activeColumnKey ? resolveFilterType(activeColumnKey) : undefined;

	return (
		<>
			<ColumnSelectModal
				visible={visible && activeStep === 'selectColumn'}
				onDismiss={handleDismiss}
				onSelectColumn={handleSelectColumn}
			/>

			{activeColumnKey && filterType === 'numeric' && (
				<FilterNumericModal
					key={activeColumnKey}
					visible={visible && activeStep === 'editFilter'}
					columnKey={activeColumnKey}
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

			{activeColumnKey && filterType === 'date' && (
				<FilterDateModal
					key={activeColumnKey}
					visible={visible && activeStep === 'editFilter'}
					columnKey={activeColumnKey}
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

			{activeColumnKey && filterType === 'string' && (
				<FilterStringModal
					key={activeColumnKey}
					visible={visible && activeStep === 'editFilter'}
					columnKey={activeColumnKey}
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

			{activeColumnKey && filterType === 'tags' && (
				<FilterTagsModal
					key={activeColumnKey}
					visible={visible && activeStep === 'editFilter'}
					columnKey={activeColumnKey}
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

export default memo(FilterModalsOrchestrator);
