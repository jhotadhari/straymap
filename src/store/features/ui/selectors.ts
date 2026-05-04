/**
 * Internal dependencies
 */
import { RootState } from "../../store";

export const selectInitialized = (state: RootState) =>
	state.ui.initialized;

export const selectExpandedElements = (state: RootState) =>
	state.ui.expandedElements;

export const selectElementExpanded = (state: RootState, key: string) =>
	state.ui.expandedElements.includes( key );
