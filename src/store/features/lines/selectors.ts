/**
 * Internal dependencies
 */
import createAppSelector from '../../createAppSelector';
import { RootState } from '../../store';

export const selectInitialized = (state: RootState) => state.lines.initialized;

export const selectSelectedIds = createAppSelector(
	(state: RootState) => state.lines.selectedIds,
	(selectedIds): number[] => [...selectedIds].sort()
);
