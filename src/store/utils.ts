/**
 * External dependencies
 */
import { ActionCreatorWithPayload, EnhancedStore } from '@reduxjs/toolkit';
import { migrate } from 'drizzle-orm/op-sqlite/migrator';

/**
 * Internal dependencies
 */
import { RootState, AppThunk } from './store';
import { initializeFromStorage as initializeFromStorage_updater } from './features/updater/connectStorage';
import { initializeFromStorage as initializeFromStorage_lang } from './features/lang/connectStorage';
import { setDbMigrated } from './features/updater/updaterSlice';
import { dbZ } from '../db/clients';
import migrations from '../../drizzle/migrations';
import features from './features';

export const initializeAppState = async (store: EnhancedStore) => {
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

export const getSetterThunkWithGetter = <T>(
	selector: (state: RootState) => T,
	setter: ActionCreatorWithPayload<T, any>
) => {
	return (newValueOrGetter: T | ((currentValue: T) => T)): AppThunk => {
		return (dispatch, getState) => {
			const currentValue = selector(getState());
			const newValue: T =
				newValueOrGetter instanceof Function
					? newValueOrGetter(currentValue)
					: newValueOrGetter;
			dispatch(setter(newValue));
		};
	};
};
