/**
 * Internal dependencies
 */
import { RootState } from "../../store";

export const selectInitialized = (state: RootState) =>
	state.dirs.initialized;

export const selectAppDirs = (state: RootState) =>
	state.dirs.appDirs;