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
import { setRoutingLineId } from '../routing/slice';
import { setActiveLineId } from '../trackRecording/slice';
import { setFollowingLineId } from '../lineFollow/slice';
import { selectItemKeys } from '../bottomDrawer/selectors';
import { CHART_KEY_PREFIX, getChartSourceKey } from './types';
import { setChartSettings } from './slice';

type ChartListenerApi = ListenerEffectAPI<RootState, AppDispatch, unknown>;

/**
 * A newly added chart opens at the natural fit: when the added key is
 * the only chart in the drawer and the chart doesn't follow the map,
 * its stored ratio is cleared. In the follow modes the mode governs
 * the viewport, so the ratio stays relevant and is kept.
 */
const resetRatioIfLoneChart = (api: ChartListenerApi, key: string): void => {
	const state = api.getState();
	const chartKeys = selectItemKeys(state).filter((k) => k.startsWith(CHART_KEY_PREFIX));
	if (chartKeys.length !== 1) {
		return;
	}
	const own = state.chart.charts[key];
	if (!own || own.followMode !== 'none' || own.ratioValue === undefined) {
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

// The routing line's chart appeared (skip clearing routingLineId). The
// action is re-dispatched with the same id on every segments reprocess —
// only react when the line id actually changes (a new chart).
startAppListening({
	actionCreator: setRoutingLineId,
	effect: (action, api) => {
		if (action.payload == null) {
			return;
		}
		if (api.getOriginalState().routing.routingLineId === action.payload) {
			return;
		}
		resetRatioIfLoneChart(api, getChartSourceKey.line(action.payload));
	},
});

// The tracking line's chart appeared (skip clearing activeLineId).
startAppListening({
	actionCreator: setActiveLineId,
	effect: (action, api) => {
		if (action.payload == null) {
			return;
		}
		resetRatioIfLoneChart(api, getChartSourceKey.line(action.payload));
	},
});

// The followed line's chart appeared (skip clearing followingLineId).
startAppListening({
	actionCreator: setFollowingLineId,
	effect: (action, api) => {
		if (action.payload == null) {
			return;
		}
		resetRatioIfLoneChart(api, getChartSourceKey.line(action.payload));
	},
});
