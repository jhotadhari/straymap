/**
 * Internal dependencies
 */
import { RootState } from '../../store';

export const selectInitialized = (state: RootState) => state.lang.initialized;

export const selectLang = (state: RootState) => state.lang.lang;
