/**
 * External dependencies
 */
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

/**
 * Internal dependencies
 */
import { SliceSettingsBase } from '../../types';
import { DEFAULT_CHART_SETTINGS, ChartSettings } from './types';

export interface ChartState extends SliceSettingsBase {
	/** per-chart-key settings (routing / line:<id>). */
	charts: Record<string, ChartSettings>;
	/** General settings — the fallback for charts without their own. */
	general: ChartSettings;
}

const initialState: ChartState = {
	initialized: false,
	charts: {},
	general: DEFAULT_CHART_SETTINGS,
};

// Slices contain Redux reducer logic for updating state, and
// generate actions that can be dispatched to trigger those updates.
export const chartSlice = createSlice({
	name: 'chart',
	initialState,
	reducers: {
		setInitialized: (state, action: PayloadAction<boolean>) => {
			state.initialized = action.payload;
		},
		setChartSettings: (
			state,
			action: PayloadAction<{ key: string; settings: Partial<ChartSettings> }>
		) => {
			const { key, settings } = action.payload;
			// No DEFAULT_CHART_SETTINGS base here: the entry must only
			// carry what was explicitly written, otherwise every chart
			// that ever received a per-chart value (ratio, follow-map)
			// would count as "custom" (selectHasOwnChartSettings).
			state.charts[key] = {
				...(state.charts[key] ?? {}),
				...settings,
			};
		},
		removeChartSettings: (state, action: PayloadAction<string[]>) => {
			for (const key of action.payload) {
				delete state.charts[key];
			}
		},
		/**
		 * Keeps only the per-chart settings of a chart.s own entry
		 * (deleting the entry entirely when none remain) — used when
		 * switching the chart back to the general (Default) mode. The
		 * always-custom settings (ratio, follow-map) must survive.
		 */
		resetChartSettingsToPerChart: (state, action: PayloadAction<string>) => {
			const key = action.payload;
			const own = state.charts[key];
			if (!own) {
				return;
			}
			const perChartOnly = {
				...(own.ratioValue !== undefined && { ratioValue: own.ratioValue }),
				...(own.followMap !== undefined && { followMap: own.followMap }),
			};
			if (Object.keys(perChartOnly).length) {
				state.charts[key] = perChartOnly as ChartSettings;
			} else {
				delete state.charts[key];
			}
		},
		setGeneralSettings: (state, action: PayloadAction<Partial<ChartSettings>>) => {
			state.general = {
				...(state.general ?? DEFAULT_CHART_SETTINGS),
				...action.payload,
			};
		},
	},
});

// Export the generated action creators for use in components.
export const {
	setInitialized,
	setChartSettings,
	removeChartSettings,
	resetChartSettingsToPerChart,
	setGeneralSettings,
} = chartSlice.actions;

// Export the slice reducer for use in the store configuration
export default chartSlice.reducer;
