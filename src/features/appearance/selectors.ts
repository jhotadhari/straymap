/**
 * Internal dependencies
 */
import { RootState } from '../../store/store';

export const selectInitialized = (state: RootState) => state.appearance.initialized;

export const selectTheme = (state: RootState) => state.appearance.theme;

export const selectCursor = (state: RootState) => state.appearance.cursor;
