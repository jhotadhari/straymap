/**
 * External dependencies
 */
import DefaultPreference from 'react-native-default-preference';
import { get, isEqual, set } from 'lodash-es';

/**
 * Internal dependencies
 */
import { startAppListening } from '../../store/listenerMiddleware';
import { AppStore } from '../../store/store';
import { logError } from '../../lib/utils';
import { setActiveKey } from '../bottomDrawer/slice';
import { getChartSourceKey } from '../chart/types';
import { linesSlice } from '../lines/slice';
import { dbConnection } from '../dbLoader/DBConnection';
import { selectInitialized, selectFollowingLineId } from './selectors';
import {
	setFollowingLineId,
	setInitialized,
	stopFollowing,
	initialSettings,
	LineFollowSettings,
	LineFollowState,
} from './slice';

const settingsKey = 'lineFollowSettings';

/**
 * Restore the followed line from DefaultPreference. Only restores while
 * the DB connection is ready (same guard as trackRecording). Follow state
 * is cleared on delete/deselect and on DB-path changes, so a stored ID
 * only goes stale if storage is edited externally.
 */
export const initializeFromStorage = (store: AppStore) => {
	if (selectInitialized(store.getState())) {
		return;
	}
	DefaultPreference.get(settingsKey)
		.then((newSettingsStr) => {
			if (newSettingsStr) {
				const newSettings = JSON.parse(newSettingsStr) as Partial<LineFollowState>;
				if (typeof newSettings.followingLineId === 'number' && dbConnection?.drizzle) {
					store.dispatch(setFollowingLineId(newSettings.followingLineId));
				}
			}
		})
		.catch((err) => logError('lineFollow/connectStorage', err))
		.finally(() => {
			store.dispatch(setInitialized(true));
		});
};

/**
 * Persist settings that differ from initialSettings to DefaultPreference.
 */
export const saveToStorage = (state: LineFollowState) => {
	if (!state.initialized) {
		return;
	}
	const settingsToSave: Partial<LineFollowSettings> = {};
	Object.keys(initialSettings).forEach((key) => {
		const valueToSave = get(state, key);
		const shouldSave = !isEqual(valueToSave, get(initialSettings, key));
		if (shouldSave) {
			set(settingsToSave, key, valueToSave);
		}
	});
	return DefaultPreference.set(settingsKey, JSON.stringify(settingsToSave));
};

/**
 * Following always selects its chart in the bottom drawer, even when other
 * charts exist — following takes priority over routing and tracking.
 */
startAppListening({
	actionCreator: setFollowingLineId,
	effect: (action, listenerApi) => {
		if (action.payload == null) {
			return;
		}
		listenerApi.dispatch(setActiveKey(getChartSourceKey.line(action.payload)));
	},
});

/**
 * Persist follow changes so following survives an app restart.
 */
startAppListening({
	actionCreator: setFollowingLineId,
	effect: (_action, listenerApi) => {
		saveToStorage(listenerApi.getState().lineFollow);
	},
});

/**
 * A followed line can be removed from the map (deselected) — that stops
 * following. Deleting a line already dispatches `clearFollowingIfMatches`
 * (and usually also a selection update); both paths are idempotent. Only
 * reacts when the followed line was previously selected and the new
 * selection no longer contains it, so selection changes while the
 * followed line was never on the map leave following untouched.
 */
startAppListening({
	actionCreator: linesSlice.actions.setSelected,
	effect: (action, listenerApi) => {
		const previousState = listenerApi.getOriginalState();
		const followingLineId = selectFollowingLineId(previousState);
		const previouslySelected = previousState.lines.selected;
		if (
			followingLineId != null &&
			previouslySelected.includes(followingLineId) &&
			!action.payload.includes(followingLineId)
		) {
			listenerApi.dispatch(stopFollowing());
		}
	},
});
