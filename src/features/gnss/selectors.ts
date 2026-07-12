/**
 * Internal dependencies
 */
import { RootState } from '../../store/store';

export const selectInitialized = (state: RootState) => state.gnss.initialized;

export const selectIsActive = (state: RootState) => state.gnss.isActive;
