/**
 * External dependencies
 */
import type { Action, ThunkAction } from '@reduxjs/toolkit';
import { configureStore } from '@reduxjs/toolkit';

/**
 * Internal dependencies
 */
import appearanceReducer from './features/appearance/appearanceSlice';
import generalReducer from './features/general/generalSlice';
import dirsReducer from './features/dirs/dirsSlice';
import routingReducer from './features/routing/routingSlice';
import uiReducer from './features/ui/uiSlice';
import updaterReducer from './features/updater/updaterSlice';
import dashboardReducer from './features/dashboard/dashboardSlice';
import baseMapReducer from './features/baseMap/baseMapSlice';
import drawersReducer from './features/drawers/drawersSlice';
import langReducer from './features/lang/langSlice';
import linesReducer from './features/lines/linesSlice';
import { listenerMiddleware } from './listenerMiddleware';
import { initializeAppState } from './utils';

export const store = configureStore({
	reducer: {
		appearance: appearanceReducer,
		general: generalReducer,
		dirs: dirsReducer,
		ui: uiReducer,
		dashboard: dashboardReducer,
		baseMap: baseMapReducer,
		drawers: drawersReducer,
		routing: routingReducer,
		updater: updaterReducer,
		lang: langReducer,
		lines: linesReducer,
	},
	devTools: false, // not working in react native currently. If ever working again, set to `__DEV__`.
	// Add the listener middleware to the store.
	// NOTE: Since this can receive actions with functions inside,
	// it should go before the serializability check middleware
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: global.shouldLog.serializableCheck,
		}).prepend(listenerMiddleware.middleware),
});

// Infer the type of `store`
export type AppStore = typeof store;
export type RootState = ReturnType<AppStore['getState']>;
// Infer the `AppDispatch` type from the store itself
export type AppDispatch = AppStore['dispatch'];
// Define a reusable type describing thunk functions
export type AppThunk<ThunkReturnType = void> = ThunkAction<
	ThunkReturnType,
	RootState,
	unknown,
	Action
>;

initializeAppState(store);
