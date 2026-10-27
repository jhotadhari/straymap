/**
 * Internal dependencies
 */
import { RootState } from '../../store/store';

export const selectInitialized = (state: RootState) => state.gnss.initialized;

export const selectIsActive = (state: RootState) => state.gnss.isActive;

export const selectGnssPosition = (state: RootState) => state.gnss.position;

export const selectIsCenterActive = (state: RootState) => state.gnss.isCenterActive;

export const selectRecenterDelaySec = (state: RootState) => state.gnss.recenterDelaySec;
