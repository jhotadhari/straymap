/**
 * Internal dependencies
 */
import { RootState } from '../../store/store';

export const selectInitialized = (state: RootState) => state.import.initialized;
export const selectDatePatterns = (state: RootState) => state.import.datePatterns;
export const selectAutoCustomDate = (state: RootState) => state.import.autoCustomDate;
export const selectMergeMode = (state: RootState) => state.import.mergeMode;
export const selectOverwriteMode = (state: RootState) => state.import.overwriteMode;
export const selectDryRun = (state: RootState) => state.import.dryRun;
export const selectKeepAppActive = (state: RootState) => state.import.keepAppActive;
export const selectFileLimit = (state: RootState) => state.import.fileLimit;
export const selectTitleMode = (state: RootState) => state.import.titleMode;
export const selectTitleRegex = (state: RootState) => state.import.titleRegex;
export const selectTagMode = (state: RootState) => state.import.tagMode;
export const selectTagRegexes = (state: RootState) => state.import.tagRegexes;
