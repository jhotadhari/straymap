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
import uiReducer from './features/ui/uiSlice';
import dashboardReducer from './features/dashboard/dashboardSlice';
import baseMapReducer from './features/baseMap/baseMapSlice';
import { listenerMiddleware } from './listenerMiddleware';

export const store = configureStore({
	reducer: {
		appearance: appearanceReducer,
		general: generalReducer,
		dirs: dirsReducer,
		ui: uiReducer,
		dashboard: dashboardReducer,
		baseMap: baseMapReducer,
	},
	devTools: true,
	// Add the listener middleware to the store.
	// NOTE: Since this can receive actions with functions inside,
	// it should go before the serializability check middleware
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware().prepend(listenerMiddleware.middleware),
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
