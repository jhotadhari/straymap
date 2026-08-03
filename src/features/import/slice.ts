/**
 * External dependencies
 */
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

/**
 * Internal dependencies
 */
import { SliceSettingsBase } from '../../types';
import { OverwriteMode, TagMode, TitleMode } from './components/types';

export interface DatePattern {
	key: string;
	regex: string;
	format: string;
	label: string;
	enabled: boolean;
	removable: boolean;
}

export const DATE_PATTERN_PRESETS: DatePattern[] = [
	{
		key: 'iso_datetime',
		regex: '(\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}(:\\d{2})?)',
		format: 'YYYY-MM-DD HH:mm:ss',
		label: 'ISO date with time',
		enabled: true,
		removable: false,
	},
	{
		key: 'iso_datetime_hhmm',
		regex: '(\\d{4}-\\d{2}-\\d{2}\\s+\\d{4})(?!\\d)',
		format: 'YYYY-MM-DD HHmm',
		label: 'ISO date with bare time',
		enabled: true,
		removable: false,
	},
	{
		key: 'iso_datetime_t',
		regex: '(\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}(:\\d{2})?)',
		format: 'YYYY-MM-DDTHH:mm:ss',
		label: 'ISO date T time',
		enabled: true,
		removable: false,
	},
	{
		key: 'iso_date',
		regex: '(\\d{4}-\\d{2}-\\d{2})',
		format: 'YYYY-MM-DD',
		label: 'ISO date',
		enabled: true,
		removable: false,
	},
	{
		key: 'eu_datetime',
		regex: '(\\d{2}\\.\\d{2}\\.\\d{4} \\d{2}:\\d{2})',
		format: 'DD.MM.YYYY HH:mm',
		label: 'EU date with time',
		enabled: true,
		removable: false,
	},
	{
		key: 'eu_date',
		regex: '(\\d{2}\\.\\d{2}\\.\\d{4})',
		format: 'DD.MM.YYYY',
		label: 'EU date',
		enabled: true,
		removable: false,
	},
	{
		key: 'eu_date_yy',
		regex: '(\\d{2}\\.\\d{2}\\.\\d{2})(?!\\d)',
		format: 'DD.MM.YY',
		label: 'EU date 2-digit year',
		enabled: true,
		removable: false,
	},
	{
		key: 'compact_datetime_hhmmss',
		regex: '(\\d{8}_\\d{6})',
		format: 'YYYYMMDD_HHmmss',
		label: 'Compact with time seconds',
		enabled: true,
		removable: false,
	},
	{
		key: 'compact_datetime_hhmm',
		regex: '(\\d{8}_\\d{4})',
		format: 'YYYYMMDD_HHmm',
		label: 'Compact with time minutes',
		enabled: true,
		removable: false,
	},
	{
		key: 'compact_datetime_dash',
		regex: '(\\d{8}-\\d{6})',
		format: 'YYYYMMDD-HHmmss',
		label: 'Compact dash time',
		enabled: true,
		removable: false,
	},
	{
		key: 'compact_date',
		regex: '((?:19|20)\\d{6})(?!\\d)',
		format: 'YYYYMMDD',
		label: 'Compact date',
		enabled: true,
		removable: false,
	},
	{
		key: 'compact_date_yy',
		regex: '(\\d{6})(?!\\d)',
		format: 'YYMMDD',
		label: 'Compact 2-digit year',
		enabled: true,
		removable: false,
	},
	{
		key: 'us_date',
		regex: '(\\d{1,2}-\\d{1,2}-\\d{4})',
		format: 'MM-DD-YYYY',
		label: 'US date',
		enabled: true,
		removable: false,
	},
	{
		key: 'military_dmy',
		regex: '(\\d{1,2}-[A-Z]{3}-\\d{4})',
		format: 'DD-MMM-YYYY',
		label: 'Military style',
		enabled: true,
		removable: false,
	},
	{
		key: 'german_dotted',
		regex: '(\\d{1,2}\\.\\s*[A-Za-zäöüß]{3,4}\\.?\\s*\\d{4})',
		format: 'DD. MMM. YYYY',
		label: 'German dotted',
		enabled: true,
		removable: false,
	},
	{
		key: 'german_full',
		regex: '(\\d{1,2}\\.\\s*[A-Za-zäöüß]{4,}\\.?\\s*\\d{4})',
		format: 'DD. MMMM YYYY',
		label: 'German full month',
		enabled: true,
		removable: false,
	},
	{
		key: 'english_text',
		regex: '([A-Z][a-z]{2,8}\\s+\\d{1,2},?\\s+\\d{4})',
		format: 'MMM DD, YYYY',
		label: 'English text',
		enabled: true,
		removable: false,
	},
	{
		key: 'german_compact',
		regex: '(\\d{1,2}\\.[A-Za-zäöüß]{3,4}\\.\\d{4})',
		format: 'DD.MMM.YYYY',
		label: 'German compact',
		enabled: true,
		removable: false,
	},
];

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
	tagRegex: string;
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
	tagRegex: '',
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
		setTagRegex: (state, action: PayloadAction<string>) => {
			state.tagRegex = action.payload;
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
	setTagRegex,
} = importSlice.actions;

export default importSlice.reducer;
