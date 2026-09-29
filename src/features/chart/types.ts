export const CHART_KEY_PREFIX = 'chart:';

export const getChartSourceKey = {
	routing: (): string => `${CHART_KEY_PREFIX}routing`,
	line: (lineId: number): string => `${CHART_KEY_PREFIX}line:${lineId}`,
	fullscreen: (lineId: number): string => `${CHART_KEY_PREFIX}fullscreen:${lineId}`,
};

export type ChartSource = { type: 'routing' } | { type: 'line'; lineId: number } | undefined;

export const getChartSourceFromKey = (key: string | undefined): ChartSource => {
	if (!key) {
		return undefined;
	}
	if (key === `${CHART_KEY_PREFIX}routing`) {
		return { type: 'routing' };
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

export interface ChartSettings {
	primary: ChartSeriesValue;
	primaryColor: ChartColorMode;
	secondary: ChartSeriesValue;
	secondaryColor: ChartColorMode;
	xMode: ChartXMode;
	/** Fixed aspect ratio (visible x-range per visible y-range unit). */
	ratioValue?: number;
	/** Viewport follows the map's covered route segment (1:1). */
	followMap: boolean;
	showLabel: boolean;
	showStats: boolean;
}

export const DEFAULT_CHART_SETTINGS: ChartSettings = {
	primary: 'elevation',
	primaryColor: 'axis',
	secondary: 'none',
	secondaryColor: 'axis',
	xMode: 'distance',
	ratioValue: undefined,
	followMap: false,
	showLabel: true,
	showStats: true,
};
