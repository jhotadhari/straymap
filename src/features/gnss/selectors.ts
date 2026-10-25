/**
 * Internal dependencies
 */
import { RootState } from '../../store/store';

export const selectInitialized = (state: RootState) => state.gnss.initialized;

export const selectIsActive = (state: RootState) => state.gnss.isActive;

export const selectGnssPosition = (state: RootState) => state.gnss.position;
