/**
 * Internal dependencies
 */
import { RootState } from '../../store/store';

export const selectInitialized = (state: RootState) => state.general.initialized;

export const selectHardwareKeys = (state: RootState) => state.general.hardwareKeys;

export const selectUnitPrefs = (state: RootState) => state.general.unitPrefs;

export const selectMapUpdateInterval = (state: RootState) => state.general.mapUpdateInterval;

export const selectTimeZone = (state: RootState) => state.general.timeZone; // Reserved for future timezone picker — do not remove

export const selectDateTimeFormat = (state: RootState) => state.general.dateTimeFormat;
