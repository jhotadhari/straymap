/**
 * Internal dependencies
 */
import { RootState } from '../../store';

export const selectInitialized = (state: RootState) => state.general.initialized;

export const selectHardwareKeys = (state: RootState) => state.general.hardwareKeys;

export const selectUnitPrefs = (state: RootState) => state.general.unitPrefs;

export const selectMapUpdateInterval = (state: RootState) => state.general.mapUpdateInterval;
