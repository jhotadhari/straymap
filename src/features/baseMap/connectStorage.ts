/**
 * External dependencies
 */
import { isAnyOf, PayloadAction } from '@reduxjs/toolkit';
import DefaultPreference from 'react-native-default-preference';
import { get, isEqual, set } from 'lodash-es';

/**
 * Internal dependencies
 */
import {
	BaseMapSettings,
	BaseMapState,
	initialSettings,
	setHgtDirPath,
	setInitialized,
	setLayers,
	setMapsforgeGeneralAction,
	setMapsforgeProfiles,
	setRenderStylesCache,
} from './slice';
import { startAppListening } from '../../store/listenerMiddleware';
import { selectInitialized } from './selectors';
import { AppStore } from '../../store/store';
import { logError } from '../../lib/utils';

const settingsKey = 'baseMapSettings';

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
				const newSettings = JSON.parse(newSettingsStr) as Partial<BaseMapState>;
				if (newSettings?.layers) {
					store.dispatch(
						setLayers({
							temp: false,
							layers: newSettings.layers,
						})
					);
				}
				if (newSettings?.mapsforgeProfiles) {
					store.dispatch(
						setMapsforgeProfiles({
							temp: false,
							mapsforgeProfiles: newSettings.mapsforgeProfiles,
						})
					);
				}
				if (newSettings?.hgtDirPath != null) {
					store.dispatch(setHgtDirPath(newSettings.hgtDirPath));
				}
				if (newSettings?.mapsforgeGeneral) {
					store.dispatch(setMapsforgeGeneralAction(newSettings.mapsforgeGeneral));
				}
				if (
					newSettings?.renderStylesCache &&
					// If renderStylesCache was saved in old type, drop it.
					!Object.values(newSettings?.renderStylesCache).some(
						(renderStyle) => renderStyle?.options || renderStyle?.default
					)
				) {
					store.dispatch(setRenderStylesCache(newSettings.renderStylesCache));
				}
			}
			store.dispatch(setInitialized(true));
		})
		.catch((err) => logError('baseMap/connectStorage', err));
};

/**
 * Compares settings in this store slice with initialSettings,
 * and saves anything that esdiffers to initialSettings to defaultPreferences.
 */
export const saveToStorage = (baseMapState: BaseMapState, actionType: string) => {
	if (!baseMapState.initialized) {
		return;
	}
	const settingsToSave: Partial<BaseMapSettings> = {};
	Object.keys(initialSettings).forEach((key) => {
		let shouldSave = false;
		let valueToSave;
		switch (key) {
			default:
				valueToSave = get(baseMapState, key);
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
	matcher: isAnyOf(
		setLayers,
		setMapsforgeProfiles,
		setHgtDirPath,
		setMapsforgeGeneralAction,
		setRenderStylesCache
	),
	effect: async (action: PayloadAction<any | { temp?: boolean }>, listenerApi) => {
		if (action.payload?.temp) {
			return;
		}
		try {
			await saveToStorage(listenerApi.getState().baseMap, action.type);
		} catch (err) {
			logError('saveToStorage', err);
		}
	},
});
