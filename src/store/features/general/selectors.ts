/**
 * Internal dependencies
 */
import { RootState } from "../../store";

export const selectInitialized = (state: RootState) =>
	state.general.initialized;

export const selectHardwareKeys = (state: RootState) =>
	state.general.hardwareKeys;