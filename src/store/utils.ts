/**
 * External dependencies
 */
import { ActionCreatorWithPayload } from '@reduxjs/toolkit';

/**
 * Internal dependencies
 */
import { RootState, AppThunk, AppStore } from './store';
import { initializeFromStorage as initializeFromStorage_dbLoader } from './features/dbLoader/connectStorage';
import { initializeFromStorage as initializeFromStorage_updater } from './features/updater/connectStorage';
import { initializeFromStorage as initializeFromStorage_lang } from './features/lang/connectStorage';
import features from './features';

export const initializeAppState = async (store: AppStore) => {
	// Initialize store language. Will as well set i18n language according to lang settings in default preference.
	initializeFromStorage_lang(store);
	// Initialize dbConnection clients.
	await initializeFromStorage_dbLoader(store);
	// Initialize the updater.
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
