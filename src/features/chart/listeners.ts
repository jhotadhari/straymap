/**
 * External dependencies
 */
import type { ListenerEffectAPI } from '@reduxjs/toolkit';

/**
 * Internal dependencies
 */
import { startAppListening } from '../../store/listenerMiddleware';
import { AppDispatch, RootState } from '../../store/store';
import { toggleChartLine } from '../lines/slice';
import { routingSlice } from '../routing/slice';
import { selectItemKeys } from '../bottomDrawer/selectors';
import { CHART_KEY_PREFIX, getChartSourceKey } from './types';
import { setChartSettings } from './slice';

type ChartListenerApi = ListenerEffectAPI<RootState, AppDispatch, unknown>;

/**
 * A newly added chart opens at the natural fit: when the added key is
 * the only chart in the drawer and the chart doesn't follow the map,
 * its stored ratio is cleared. The ratio stays relevant while following
 * and is kept for when follow-map is switched off.
 */
const resetRatioIfLoneChart = (api: ChartListenerApi, key: string): void => {
	const state = api.getState();
	const chartKeys = selectItemKeys(state).filter((k) => k.startsWith(CHART_KEY_PREFIX));
	if (chartKeys.length !== 1) {
		return;
	}
	const own = state.chart.charts[key];
	if (!own || own.followMap || own.ratioValue === undefined) {
		return;
	}
	api.dispatch(setChartSettings({ key, settings: { ratioValue: undefined } }));
};

// A line's chart was just enabled (skip removals).
startAppListening({
	actionCreator: toggleChartLine,
	effect: (action, api) => {
		if (!api.getState().lines.chartLines.includes(action.payload)) {
			return;
		}
		resetRatioIfLoneChart(api, getChartSourceKey.line(action.payload));
	},
});

// The routing chart appeared (skip exiting routing mode).
startAppListening({
	actionCreator: routingSlice.actions.setIsRouting,
	effect: (action, api) => {
		if (!action.payload) {
			return;
		}
		resetRatioIfLoneChart(api, getChartSourceKey.routing());
	},
});
