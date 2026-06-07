/**
 * Internal dependencies
 */
import { RootState } from '../../store';

export const selectInitialized = (state: RootState) => state.lines.initialized;

export const selectSelectedIds = (state: RootState) => state.lines.selectedIds;

export const selectLines = (state: RootState) => state.lines.lines;

