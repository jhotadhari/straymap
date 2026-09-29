/**
 * External dependencies
 */
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

/**
 * Internal dependencies
 */
import { SliceSettingsBase } from '../../types';
import { AppThunk } from '../../store/store';
import { addUiItemKey, setUiItemKeys } from '../ui/slice';
import { selectUiItemKeys } from '../ui/selectors';
import { DEFAULT_CHART_SETTINGS, ChartSettings } from './types';

export const CHART_FULLSCREEN_UI_ITEM_KEY = 'chartFullscreen';

export interface ChartState extends SliceSettingsBase {
	/** per-chart-key settings (routing / line:<id> / fullscreen:<id>). */
	charts: Record<string, ChartSettings>;
	/** General settings — the fallback for charts without their own. */
	general: ChartSettings;
	/** The line the fullscreen chart UiItem is dedicated to. */
	fullscreenLineId?: number;
}

const initialState: ChartState = {
	initialized: false,
	charts: {},
	general: DEFAULT_CHART_SETTINGS,
	fullscreenLineId: undefined,
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
		setFullscreenLineId: (state, action: PayloadAction<number | undefined>) => {
			state.fullscreenLineId = action.payload;
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
	setFullscreenLineId,
} = chartSlice.actions;

// Export the slice reducer for use in the store configuration
export default chartSlice.reducer;

/**
 * Dedicate the fullscreen chart UiItem to a single line and open it.
 * The UiItem.s chart is independent from the bottom drawer chart of
 * the same line (settings are stored under chart:fullscreen:<id>).
 */
export const openFullscreenChart = (lineId: number): AppThunk => {
	return (dispatch) => {
		dispatch(chartSlice.actions.setFullscreenLineId(lineId));
		dispatch(addUiItemKey(CHART_FULLSCREEN_UI_ITEM_KEY));
	};
};

/**
 * Close the fullscreen chart UiItem (remove its key from the UiItem
 * stack and clear the dedicated line).
 */
export const closeFullscreenChart = (): AppThunk => {
	return (dispatch, getState) => {
		dispatch(
			setUiItemKeys(
				selectUiItemKeys(getState()).filter((key) => key !== CHART_FULLSCREEN_UI_ITEM_KEY)
			)
		);
		dispatch(chartSlice.actions.setFullscreenLineId(undefined));
	};
};
