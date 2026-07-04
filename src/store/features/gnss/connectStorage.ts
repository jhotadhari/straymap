/**
 * External dependencies
 */
import { isAnyOf } from '@reduxjs/toolkit';
import DefaultPreference from 'react-native-default-preference';
import { get, isEqual, set } from 'lodash-es';

/**
 * Internal dependencies
 */
import { GnssSettings, GnssState, initialSettings, setInitialized, setIsActive } from './slice';
import { startAppListening } from '../../listenerMiddleware';
import { selectInitialized } from './selectors';
import { AppStore } from '../../store';
import { logError } from '../../../lib/utils';

const settingsKey = 'gnssSettings';

export const initializeFromStorage = (store: AppStore) => {
	if (selectInitialized(store.getState())) {
		return;
	}
	DefaultPreference.get(settingsKey)
		.then((newSettingsStr) => {
			if (newSettingsStr) {
				const newSettings = JSON.parse(newSettingsStr) as Partial<GnssState>;
				if (typeof newSettings.isActive === 'boolean') {
					store.dispatch(setIsActive(newSettings.isActive));
				}
			}
			store.dispatch(setInitialized(true));
		})
		.catch((err) => logError('gnss/connectStorage', err));
};

export const saveToStorage = (state: GnssState, _actionType: string) => {
	if (!state.initialized) {
		return;
	}
	const settingsToSave: Partial<GnssSettings> = {};
	Object.keys(initialSettings).forEach((key) => {
		const valueToSave = get(state, key);
		const shouldSave = !isEqual(valueToSave, get(initialSettings, key));
		if (shouldSave) {
			set(settingsToSave, key, valueToSave);
		}
	});
	return DefaultPreference.set(settingsKey, JSON.stringify(settingsToSave));
};

startAppListening({
	matcher: isAnyOf(setIsActive),
	effect: async (action, listenerApi) => {
		try {
			await saveToStorage(listenerApi.getState().gnss, action.type);
		} catch (err) {
			logError('saveToStorage', err);
		}
	},
});
