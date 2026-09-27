/**
 * Internal dependencies
 */
import { omit, pick } from 'lodash-es';
import createAppSelector from '../../store/createAppSelector';
import { RootState } from '../../store/store';
import { DEFAULT_CHART_SETTINGS, ChartSettings } from './types';

/**
 * Settings keys that are always per-chart ("custom") — the general
 * settings never contribute these to a chart.s effective settings.
 */
export const PER_CHART_SETTINGS_KEYS = [
	'ratioValue',
	'followMap',
] as const;

export const selectInitialized = (state: RootState) => state.chart.initialized;

export const selectGeneralSettings = createAppSelector(
	(state: RootState) => state.chart.general,
	(general): ChartSettings => ({
		...DEFAULT_CHART_SETTINGS,
		...general,
	})
);

export const selectHasOwnChartSettings = (state: RootState, key: string | undefined): boolean => {
	if (!key) {
		return false;
	}
	const own = state.chart.charts[key];
	if (!own) {
		return false;
	}
	// per-chart-only entries (ratio / follow-map) don't count as "custom"
	// — the Default/Custom mode governs everything except those.
	return Object.keys(omit(own, PER_CHART_SETTINGS_KEYS)).length > 0;
};

export const selectChartSettings = createAppSelector(
	(state: RootState) => state.chart.general,
	(state: RootState) => state.chart.charts,
	(_state: RootState, key: string | undefined) => key,
	(general, charts, key): ChartSettings => ({
		...DEFAULT_CHART_SETTINGS,
		...omit(general, PER_CHART_SETTINGS_KEYS),
		...(key ? (charts[key] ?? {}) : {}),
	})
);

/** The chart.s own per-chart settings (always custom). */
export const selectOwnPerChartSettings = createAppSelector(
	(state: RootState) => state.chart.charts,
	(_state: RootState, key: string | undefined) => key,
	(charts, key): Partial<Pick<ChartSettings, 'ratioValue' | 'followMap'>> =>
		key ? pick(charts[key] ?? {}, PER_CHART_SETTINGS_KEYS) : {}
);
