/**
 * Internal dependencies
 */
import { startAppListening } from '../../store/listenerMiddleware';
import { AppStore } from '../../store/store';
import { setActiveKey } from '../bottomDrawer/slice';
import { getChartSourceKey } from '../chart/types';
import { selectInitialized } from './selectors';
import { setFollowingLineId, setInitialized } from './slice';

/**
 * No persisted settings — following is a runtime-only session state.
 * Just mark the feature initialized so the app shell unblocks.
 */
export const initializeFromStorage = (store: AppStore) => {
	if (selectInitialized(store.getState())) {
		return;
	}
	store.dispatch(setInitialized(true));
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
