/**
 * External dependencies
 */
import { isAnyOf } from '@reduxjs/toolkit';
import DefaultPreference from 'react-native-default-preference';
import { get, isEqual, set } from 'lodash-es';

/**
 * Internal dependencies
 */
import { LangSettings, LangState, initialSettings, setInitialized, setLang } from './slice';
import { startAppListening } from '../../store/listenerMiddleware';
import { changeLang } from '../../assets/i18n/i18n';
import { setDayjsLocale } from '../../lib/dayjs';
import { SUPPORTED_LANGUAGES } from '../../assets/i18n/constants';
import { selectInitialized } from './selectors';
import { AppStore } from '../../store/store';
import { logError } from '../../lib/utils';

const settingsKey = 'langSettings';

/**
 * Listen to state lang changes and change i18n lang.
 */
startAppListening({
	actionCreator: setLang,
	effect: async (action) => {
		changeLang(action.payload);
		setDayjsLocale(action.payload);
	},
});

/**
 * Loads settings from defaultPreferences and dispatches them to the store.
 */
export const initializeFromStorage = (store: AppStore) => {
	if (selectInitialized(store.getState())) {
		return;
	}
	DefaultPreference.get(settingsKey)
		.then((newSettingsStr) => {
			if (newSettingsStr) {
				const newSettings = JSON.parse(newSettingsStr) as Partial<LangState>;
				if (
					newSettings?.lang &&
					('system' === newSettings.lang ||
						([...SUPPORTED_LANGUAGES] as string[]).includes(newSettings.lang))
				) {
					store.dispatch(setLang(newSettings.lang));
					setDayjsLocale(newSettings.lang);
				}
			}
			store.dispatch(setInitialized(true));
		})
		.catch((err) => logError('lang/connectStorage', err));
};

/**
 * Compares settings in this store slice with initialSettings,
 * and saves anything that differs to initialSettings to defaultPreferences.
 */
export const saveToStorage = (langState: LangState, actionType: string) => {
	if (!langState.initialized) {
		return;
	}
	const settingsToSave: Partial<LangSettings> = {};
	Object.keys(initialSettings).forEach((key) => {
		let shouldSave = false;
		let valueToSave;
		switch (key) {
			default:
				valueToSave = get(langState, key);
				shouldSave = !isEqual(valueToSave, get(initialSettings, key));
		}
		if (shouldSave) {
			set(settingsToSave, key, valueToSave);
		}
	});
	if (__DEV__ && globalThis.shouldLog.saveToStorage) {
		console.log('DEBUG saveToStorage', settingsKey, actionType, settingsToSave);
	}
	return DefaultPreference.set(settingsKey, JSON.stringify(settingsToSave));
};

/**
 * Listens to action that change settings in this store slice,
 * and calls the function to save them to defaultPreferences.
 */
startAppListening({
	matcher: isAnyOf(setLang),
	effect: async (action, listenerApi) => {
		try {
			await saveToStorage(listenerApi.getState().lang, action.type);
		} catch (err) {
			logError('saveToStorage', err);
		}
	},
});
