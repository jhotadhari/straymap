/**
 * Tests for chart slice reducers and selectors.
 */

/**
 * Internal dependencies
 */
import chartReducer, {
	setInitialized,
	setChartSettings,
	removeChartSettings,
	resetChartSettingsToPerChart,
	setGeneralSettings,
	setFullscreenLineId,
} from '../slice';
import {
	selectGeneralSettings,
	selectHasOwnChartSettings,
	selectOwnPerChartSettings,
	selectChartSettings,
} from '../selectors';
import { DEFAULT_CHART_SETTINGS } from '../types';
import type { RootState } from '../../../store/store';

const buildRoot = (state?: Partial<{ charts: Record<string, object>; general: object }>) =>
	({
		chart: {
			initialized: false,
			charts: {},
			general: DEFAULT_CHART_SETTINGS,
			...state,
		},
	}) as unknown as RootState;

describe('chart slice reducers', () => {
	it('setInitialized', () => {
		const state = chartReducer(undefined, setInitialized(true));
		expect(state.initialized).toBe(true);
	});

	it('setFullscreenLineId sets and clears the dedicated fullscreen line', () => {
		const state = chartReducer(undefined, setFullscreenLineId(42));
		expect(state.fullscreenLineId).toBe(42);
		const cleared = chartReducer(state, setFullscreenLineId(undefined));
		expect(cleared.fullscreenLineId).toBeUndefined();
	});

	it('setChartSettings stores only the written keys', () => {
		let state = chartReducer(
			undefined,
			setChartSettings({ key: 'routing', settings: { secondary: 'slope' } })
		);
		expect(state.charts['routing']).toEqual({ secondary: 'slope' });
		state = chartReducer(
			state,
			setChartSettings({ key: 'routing', settings: { primaryColor: 'slope' } })
		);
		expect(state.charts['routing']).toEqual({
			secondary: 'slope',
			primaryColor: 'slope',
		});
	});

	it('removeChartSettings deletes keys', () => {
		let state = chartReducer(
			undefined,
			setChartSettings({ key: 'line:1', settings: { secondary: 'slope' } })
		);
		state = chartReducer(undefined, {
			type: 'chart/setChartSettings',
			payload: { key: 'line:2', settings: {} },
		} as any);
		state = chartReducer(state, removeChartSettings(['line:1']));
		expect(state.charts['line:1']).toBeUndefined();
	});

	it('setGeneralSettings merges partial settings', () => {
		const state = chartReducer(undefined, setGeneralSettings({ primaryColor: 'slope' }));
		expect(state.general).toEqual({
			...DEFAULT_CHART_SETTINGS,
			primaryColor: 'slope',
		});
	});

	it('resetChartSettingsToPerChart keeps only the per-chart props', () => {
		let state = chartReducer(
			undefined,
			setChartSettings({
				key: 'line:1',
				settings: { primaryColor: 'slope', ratioValue: 20, followMap: true },
			})
		);
		state = chartReducer(state, resetChartSettingsToPerChart('line:1'));
		expect(state.charts['line:1']).toEqual({ ratioValue: 20, followMap: true });
	});

	it('resetChartSettingsToPerChart drops non-per-chart props of a merged entry', () => {
		// setChartSettings stores only the written keys — an entry
		// without per-chart props is deleted entirely.
		let state = chartReducer(
			undefined,
			setChartSettings({ key: 'line:2', settings: { primaryColor: 'slope' } })
		);
		state = chartReducer(state, resetChartSettingsToPerChart('line:2'));
		expect(state.charts['line:2']).toBeUndefined();
		expect(selectHasOwnChartSettings({ chart: state } as unknown as RootState, 'line:2')).toBe(
			false
		);
	});

	it('per-chart-only writes do not make a chart custom', () => {
		// A chart that only ever received per-chart values (ratio,
		// follow-map) stays in the general (Default) mode.
		const state = chartReducer(
			undefined,
			setChartSettings({ key: 'line:2b', settings: { ratioValue: 20 } })
		);
		expect(selectHasOwnChartSettings({ chart: state } as unknown as RootState, 'line:2b')).toBe(
			false
		);
	});
});

describe('chart selectors', () => {
	it('selectChartSettings returns defaults for unknown keys', () => {
		expect(selectChartSettings(buildRoot(), 'routing')).toEqual(DEFAULT_CHART_SETTINGS);
	});

	it('selectChartSettings returns stored settings', () => {
		const state = chartReducer(
			undefined,
			setChartSettings({ key: 'line:3', settings: { primaryColor: 'slope' } })
		);
		const root = { chart: state } as unknown as RootState;
		expect(selectChartSettings(root, 'line:3').primaryColor).toBe('slope');
	});

	it('selectChartSettings merges defaults for partial stored settings', () => {
		// Simulates older persisted settings restored without the new keys.
		const root = {
			chart: {
				initialized: true,
				general: DEFAULT_CHART_SETTINGS,
				charts: { 'line:4': { primaryColor: 'slope' } },
			},
		} as unknown as RootState;
		const settings = selectChartSettings(root, 'line:4');
		expect(settings.primaryColor).toBe('slope');
		expect(settings.primary).toBe('elevation');
		expect(settings.ratioValue).toBeUndefined();
		expect(settings.followMap).toBe(false);
		expect(settings.showLabel).toBe(true);
		expect(settings.showStats).toBe(true);
	});

	it('selectChartSettings ignores the removed colorMode key', () => {
		// Old persisted charts carried a `colorMode` key — it must not
		// leak into the new model; the defaults apply instead.
		const root = {
			chart: {
				initialized: true,
				general: DEFAULT_CHART_SETTINGS,
				charts: { 'line:4': { colorMode: 'slope' } as object },
			},
		} as unknown as RootState;
		const settings = selectChartSettings(root, 'line:4');
		expect(settings.primaryColor).toBe('axis');
		expect(settings.secondaryColor).toBe('axis');
	});

	it('selectChartSettings keeps the always-general settings general', () => {
		// A chart.s own entry must not contribute showLabel/showStats —
		// the general value always wins.
		const root = buildRoot({
			general: { ...DEFAULT_CHART_SETTINGS, showLabel: true },
			charts: { 'line:4b': { showLabel: false, showStats: false } },
		});
		expect(selectChartSettings(root, 'line:4b').showLabel).toBe(true);
		expect(selectChartSettings(root, 'line:4b').showStats).toBe(true);
		expect(selectHasOwnChartSettings(root, 'line:4b')).toBe(false);
	});

	it('selectChartSettings falls back to the general settings', () => {
		const root = buildRoot({
			general: { ...DEFAULT_CHART_SETTINGS, primaryColor: 'slope' },
		});
		expect(selectChartSettings(root, 'line:5').primaryColor).toBe('slope');
		expect(selectChartSettings(root, 'line:5').secondary).toBe('none');
	});

	it('selectChartSettings prefers own settings over the general settings', () => {
		const root = buildRoot({
			general: { ...DEFAULT_CHART_SETTINGS, primaryColor: 'slope' },
			charts: { 'line:6': { primaryColor: 'axis' } },
		});
		expect(selectChartSettings(root, 'line:6').primaryColor).toBe('axis');
	});

	it('selectGeneralSettings merges defaults', () => {
		expect(selectGeneralSettings(buildRoot())).toEqual(DEFAULT_CHART_SETTINGS);
		const root = buildRoot({
			general: { ...DEFAULT_CHART_SETTINGS, showStats: false },
		});
		expect(selectGeneralSettings(root).showStats).toBe(false);
	});

	it('selectHasOwnChartSettings detects own entries', () => {
		const root = buildRoot({
			charts: { 'line:7': { primaryColor: 'slope' } },
		});
		expect(selectHasOwnChartSettings(root, 'line:7')).toBe(true);
		expect(selectHasOwnChartSettings(root, 'line:8')).toBe(false);
		expect(selectHasOwnChartSettings(root, undefined)).toBe(false);
	});

	it('selectHasOwnChartSettings ignores per-chart-only entries', () => {
		const root = buildRoot({
			charts: {
				'line:9': { ratioValue: 20, followMap: true },
			},
		});
		expect(selectHasOwnChartSettings(root, 'line:9')).toBe(false);
	});

	it('selectChartSettings ignores the general per-chart settings', () => {
		const root = buildRoot({
			general: { ...DEFAULT_CHART_SETTINGS, ratioValue: 20, followMap: true },
		});
		const settings = selectChartSettings(root, 'line:10');
		expect(settings.ratioValue).toBeUndefined();
		expect(settings.followMap).toBe(false);
	});

	it('selectChartSettings uses the own per-chart settings independently per chart', () => {
		const root = buildRoot({
			charts: {
				'line:11': { ratioValue: 20 },
				'line:12': { ratioValue: 30, followMap: true },
			},
		});
		expect(selectChartSettings(root, 'line:11').ratioValue).toBe(20);
		expect(selectChartSettings(root, 'line:11').followMap).toBe(false);
		expect(selectChartSettings(root, 'line:12').ratioValue).toBe(30);
		expect(selectChartSettings(root, 'line:12').followMap).toBe(true);
		expect(selectChartSettings(root, 'line:13').ratioValue).toBeUndefined();
		expect(selectChartSettings(root, 'line:13').followMap).toBe(false);
	});

	it('selectOwnPerChartSettings returns only the own per-chart props', () => {
		const root = buildRoot({
			charts: {
				'line:14': { primaryColor: 'slope', ratioValue: 25, followMap: true },
			},
		});
		expect(selectOwnPerChartSettings(root, 'line:14')).toEqual({
			ratioValue: 25,
			followMap: true,
		});
		expect(selectOwnPerChartSettings(root, 'line:15')).toEqual({});
	});
});
