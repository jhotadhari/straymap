/**
 * External dependencies
 */
import type { Action, ThunkAction } from '@reduxjs/toolkit';
import { configureStore } from '@reduxjs/toolkit';

/**
 * Internal dependencies
 */
import appearanceReducer from '../features/appearance/slice';
import generalReducer from '../features/general/slice';
import dbLoaderReducer from '../features/dbLoader/slice';
import dirsReducer from '../features/dirs/slice';
import routingReducer from '../features/routing/slice';
import uiReducer from '../features/ui/slice';
import updaterReducer from '../features/updater/slice';
import dashboardReducer from '../features/dashboard/slice';
import baseMapReducer from '../features/baseMap/slice';
import drawersReducer from '../features/drawers/slice';
import langReducer from '../features/lang/slice';
import linesReducer from '../features/lines/slice';
import gnssReducer from '../features/gnss/slice';
import trackRecordingReducer from '../features/trackRecording/slice';
import { listenerMiddleware } from './listenerMiddleware';
import { initializeAppState } from '../features/utils';

export const store = configureStore({
	reducer: {
		appearance: appearanceReducer,
		general: generalReducer,
		dbLoader: dbLoaderReducer,
		dirs: dirsReducer,
		ui: uiReducer,
		dashboard: dashboardReducer,
		baseMap: baseMapReducer,
		drawers: drawersReducer,
		routing: routingReducer,
		updater: updaterReducer,
		lang: langReducer,
		lines: linesReducer,
		gnss: gnssReducer,
		trackRecording: trackRecordingReducer,
	},
	devTools: false, // not working in react native currently. If ever working again, set to `__DEV__`.
	// Add the listener middleware to the store.
	// NOTE: Since this can receive actions with functions inside,
	// it should go before the serializability check middleware
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: global.shouldLog.serializableCheck,
			immutableStateInvariant: global.shouldLog.immutableStateInvariant,
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
