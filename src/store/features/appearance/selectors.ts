/**
 * Internal dependencies
 */
import { RootState } from "../../store";

export const selectInitialized = (state: RootState) =>
	state.appearance.initialized;

export const selectCursor = (state: RootState) =>
	state.appearance.cursor;