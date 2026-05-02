/**
 * Internal dependencies
 */
import { RootState } from "../../store";

export const selectInitialized = (state: RootState) =>
	state.general.initialized;

export const selectLang = (state: RootState) =>
	state.general.lang;

export const selectHardwareKeys = (state: RootState) =>
	state.general.hardwareKeys;

export const selectUnitPrefs = (state: RootState) =>
	state.general.unitPrefs;

export const selectMapEventRate = (state: RootState) =>
	state.general.mapEventRate;