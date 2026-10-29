export const CHART_KEY_PREFIX = 'chart:';

export const getChartSourceKey = {
	line: (lineId: number): string => `${CHART_KEY_PREFIX}line:${lineId}`,
	fullscreen: (lineId: number): string => `${CHART_KEY_PREFIX}fullscreen:${lineId}`,
};

export type ChartSource = { type: 'line'; lineId: number } | undefined;

export const getChartSourceFromKey = (key: string | undefined): ChartSource => {
	if (!key) {
		return undefined;
	}
	const match = key.match(/^chart:(line|fullscreen):(\d+)$/);
	if (match) {
		return { type: 'line', lineId: parseInt(match[2], 10) };
	}
	return undefined;
};

// ── per-chart settings (persisted) ──────────────────────────────────

export type ChartXMode = 'distance' | 'time';
export type ChartSeriesValue = 'none' | 'elevation' | 'slope';
export type ChartColorMode = 'axis' | 'elevation' | 'elevationFill' | 'slope' | 'slopeFill';
export type ChartFollowMode = 'none' | 'map' | 'center';

export interface ChartSettings {
	primary: ChartSeriesValue;
	primaryColor: ChartColorMode;
	secondary: ChartSeriesValue;
	secondaryColor: ChartColorMode;
	xMode: ChartXMode;
	/** Fixed aspect ratio (visible x-range per visible y-range unit). */
	ratioValue?: number;
	/** How the chart follows the map: Off, covered segment (1:1), or centered on the map center. */
	followMode: ChartFollowMode;
	/** Ease the follow-derived viewport instead of jumping (all charts). */
	animateFollow: boolean;
	showHeading: boolean;
	showStats: boolean;
}

export const DEFAULT_CHART_SETTINGS: ChartSettings = {
	primary: 'elevation',
	primaryColor: 'axis',
	secondary: 'none',
	secondaryColor: 'axis',
	xMode: 'distance',
	ratioValue: undefined,
	followMode: 'none',
	animateFollow: true,
	showHeading: true,
	showStats: true,
};
