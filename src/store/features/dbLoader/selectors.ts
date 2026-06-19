/**
 * Internal dependencies
 */
import { RootState } from '../../store';

export const selectInitialized = (state: RootState) => state.dbLoader.initialized;

export const selectDbPath = (state: RootState) => state.dbLoader.dbPath;

export const selectDbMigrated = (state: RootState) => state.dbLoader.dbMigrated;
