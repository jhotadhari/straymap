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
import updaterReducer, { setDbMigrated } from './features/updater/updaterSlice';
import dashboardReducer from './features/dashboard/dashboardSlice';
import baseMapReducer from './features/baseMap/baseMapSlice';
import drawersReducer from './features/drawers/drawersSlice';
import langReducer from './features/lang/langSlice';
import linesReducer from './features/lines/linesSlice';
import { listenerMiddleware } from './listenerMiddleware';
import { initializeFromStorage as initializeFromStorage_updater } from './features/updater/connectStorage';
import { initializeFromStorage as initializeFromStorage_lang } from './features/lang/connectStorage';
import { useAppSelector } from './hooks';
import features from './features';
import { migrate } from 'drizzle-orm/op-sqlite/migrator';
import { dbZ } from '../db/client';
import migrations from '../../drizzle/migrations';
import { dbOpExecute } from '../db/utils';

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

const initialize = async () => {
	// Initialize store language. Will as well set i18n language according to lang settings in default preference.
	initializeFromStorage_lang(store);
	// Migrate database.
	await new Promise((resolve) => {
		migrate(dbZ, migrations)
			.then(async () => {
				store.dispatch(setDbMigrated(true));
				resolve(true);
			})
			.catch((error) => {
				store.dispatch(setDbMigrated(error.message));

				// ??? somehow add button to src/store/features/updater/components/SplashScreenDbMigration.tsx
				// to allow to backup existing db and start a new one.
			});
	});
	// Initialize the updater .
	const success = await initializeFromStorage_updater(store);
	// Initialize all other features: All features that expose a initializeFromStorage function.
	if (success) {
		Object.values(features).forEach((feature) => {
			if (feature?.initializeFromStorage) {
				feature?.initializeFromStorage(store);
			}
		});
	}
};
initialize();

export const useSettingsInitialized = () => {
	return Object.values(features).reduce((acc, feature) => {
		const settingsInitialized = useAppSelector(feature.selectInitialized);
		acc.push(settingsInitialized);
		return acc;
	}, [] as boolean[]);
};
