/**
 * External dependencies
 */
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

/**
 * Internal dependencies
 */
import { SliceSettingsBase } from '../../types';
import { DatePattern, OverwriteMode, TagMode, TitleMode } from './types';
import { DATE_PATTERN_PRESETS } from './constants';

export interface ImportSettings {
	datePatterns: DatePattern[];
	autoCustomDate: boolean;
	mergeMode: boolean;
	overwriteMode: OverwriteMode;
	dryRun: boolean;
	keepAppActive: boolean;
	fileLimit: number;
	titleMode: TitleMode;
	titleRegex: string;
	tagMode: TagMode;
	tagRegexes: string[];
	selectedTagIds: number[];
}

export interface ImportState extends SliceSettingsBase, ImportSettings {}

export const initialSettings: ImportSettings = {
	datePatterns: DATE_PATTERN_PRESETS,
	autoCustomDate: false,
	mergeMode: true,
	overwriteMode: 'create',
	dryRun: false,
	keepAppActive: false,
	fileLimit: 0,
	titleMode: 'none',
	titleRegex: '',
	tagMode: 'none',
	tagRegexes: [],
	selectedTagIds: [],
};

const initialState: ImportState = {
	initialized: false,
	...initialSettings,
};

export const importSlice = createSlice({
	name: 'import',
	initialState,
	reducers: {
		setInitialized: (state, action: PayloadAction<boolean>) => {
			state.initialized = action.payload;
		},
		setDatePatterns: (state, action: PayloadAction<DatePattern[]>) => {
			state.datePatterns = action.payload;
		},
		addDatePattern: (state, action: PayloadAction<DatePattern>) => {
			state.datePatterns.unshift(action.payload);
		},
		removeDatePattern: (state, action: PayloadAction<string>) => {
			state.datePatterns = state.datePatterns.filter(
				(p) => p.key !== action.payload || !p.removable
			);
		},
		toggleDatePattern: (state, action: PayloadAction<string>) => {
			const p = state.datePatterns.find((dp) => dp.key === action.payload);
			if (p) p.enabled = !p.enabled;
		},
		reorderDatePatterns: (state, action: PayloadAction<string[]>) => {
			const ordered = action.payload
				.map((key) => state.datePatterns.find((p) => p.key === key))
				.filter((p): p is DatePattern => !!p);
			if (ordered.length === state.datePatterns.length) {
				state.datePatterns = ordered;
			}
		},
		setAutoCustomDate: (state, action: PayloadAction<boolean>) => {
			state.autoCustomDate = action.payload;
		},
		setMergeMode: (state, action: PayloadAction<boolean>) => {
			state.mergeMode = action.payload;
		},
		setOverwriteMode: (state, action: PayloadAction<OverwriteMode>) => {
			state.overwriteMode = action.payload;
		},
		setDryRun: (state, action: PayloadAction<boolean>) => {
			state.dryRun = action.payload;
		},
		setKeepAppActive: (state, action: PayloadAction<boolean>) => {
			state.keepAppActive = action.payload;
		},
		setFileLimit: (state, action: PayloadAction<number>) => {
			state.fileLimit = action.payload;
		},
		setTitleMode: (state, action: PayloadAction<TitleMode>) => {
			state.titleMode = action.payload;
		},
		setTitleRegex: (state, action: PayloadAction<string>) => {
			state.titleRegex = action.payload;
		},
		setTagMode: (state, action: PayloadAction<TagMode>) => {
			state.tagMode = action.payload;
		},
		setTagRegexes: (state, action: PayloadAction<string[]>) => {
			state.tagRegexes = action.payload;
		},
		addTagRegex: (state, action: PayloadAction<string>) => {
			state.tagRegexes.push(action.payload);
		},
		removeTagRegex: (state, action: PayloadAction<number>) => {
			state.tagRegexes.splice(action.payload, 1);
		},
		setSelectedTagIds: (state, action: PayloadAction<number[]>) => {
			state.selectedTagIds = action.payload;
		},
	},
});

export const {
	setInitialized,
	setDatePatterns,
	addDatePattern,
	removeDatePattern,
	toggleDatePattern,
	reorderDatePatterns,
	setAutoCustomDate,
	setMergeMode,
	setOverwriteMode,
	setDryRun,
	setKeepAppActive,
	setFileLimit,
	setTitleMode,
	setTitleRegex,
	setTagMode,
	setTagRegexes,
	addTagRegex,
	removeTagRegex,
	setSelectedTagIds,
} = importSlice.actions;

export default importSlice.reducer;
