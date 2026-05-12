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
import drawersReducer from './features/drawers/drawersSlice';
import { listenerMiddleware } from './listenerMiddleware';
import { initializeFromStorage as initializeFromStorage_appearance } from './features/appearance/connectStorage';
import { initializeFromStorage as initializeFromStorage_baseMap } from './features/baseMap/connectStorage';
import { initializeFromStorage as initializeFromStorage_dashboard } from './features/dashboard/connectStorage';
import { initializeFromStorage as initializeFromStorage_dirs } from './features/dirs/connectStorage';
import { initializeFromStorage as initializeFromStorage_drawers } from './features/drawers/connectStorage';
import { initializeFromStorage as initializeFromStorage_general } from './features/general/connectStorage';
import { initializeFromStorage as initializeFromStorage_ui } from './features/ui/connectStorage';
import { selectInitialized as selectSettingsInitialized_appearance } from '../store/features/appearance/selectors';
import { selectInitialized as selectSettingsInitialized_baseMap } from '../store/features/baseMap/selectors';
import { selectInitialized as selectSettingsInitialized_dashboard } from '../store/features/dashboard/selectors';
import { selectInitialized as selectSettingsInitialized_dirs } from '../store/features/dirs/selectors';
import { selectInitialized as selectSettingsInitialized_drawers } from '../store/features/drawers/selectors';
import { selectInitialized as selectSettingsInitialized_general } from '../store/features/general/selectors';
import { selectInitialized as selectSettingsInitialized_ui } from '../store/features/ui/selectors';
import { useAppSelector } from './hooks';

export const store = configureStore({
	reducer: {
		appearance: appearanceReducer,
		general: generalReducer,
		dirs: dirsReducer,
		ui: uiReducer,
		dashboard: dashboardReducer,
		baseMap: baseMapReducer,
		drawers: drawersReducer,
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

initializeFromStorage_appearance(store);
initializeFromStorage_baseMap(store);
initializeFromStorage_dashboard(store);
initializeFromStorage_dirs(store);
initializeFromStorage_drawers(store);
initializeFromStorage_general(store);
initializeFromStorage_ui(store);

export const useSettingsInitialized = () => {
	const settingsInitialized_appearance = useAppSelector(selectSettingsInitialized_appearance);
	const settingsInitialized_baseMap = useAppSelector(selectSettingsInitialized_baseMap);
	const settingsInitialized_dashboard = useAppSelector(selectSettingsInitialized_dashboard);
	const settingsInitialized_dirs = useAppSelector(selectSettingsInitialized_dirs);
	const settingsInitialized_drawers = useAppSelector(selectSettingsInitialized_drawers);
	const settingsInitialized_general = useAppSelector(selectSettingsInitialized_general);
	const settingsInitialized_ui = useAppSelector(selectSettingsInitialized_ui);
	return (
		settingsInitialized_appearance &&
		settingsInitialized_baseMap &&
		settingsInitialized_dashboard &&
		settingsInitialized_dirs &&
		settingsInitialized_drawers &&
		settingsInitialized_general &&
		settingsInitialized_ui
	);
};
