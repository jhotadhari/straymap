/**
 * Internal dependencies
 */
import { RootState } from '../../store';

export const selectInitialized = (state: RootState) => state.updater.initialized;

export const selectInstalledVersion = (state: RootState) => state.updater.installedVersion;

export const selectIsUpdating = (state: RootState) => state.updater.isUpdating;
