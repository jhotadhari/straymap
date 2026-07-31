/**
 * Internal dependencies
 */
import { RootState } from '../../store/store';

export const selectInitialized = (state: RootState) => state.dbLoader.initialized;

export const selectDbPath = (state: RootState) => state.dbLoader.dbPath;

export const selectDbMigrated = (state: RootState) => state.dbLoader.dbMigrated;

export const selectRequireReload = (state: RootState) => state.dbLoader.requireReload;

export const selectDbPendingMigrations = (state: RootState) => state.dbLoader.dbPendingMigrations;
