/**
 * External dependencies
 */
import { isAnyOf, PayloadAction, type EnhancedStore } from '@reduxjs/toolkit';
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
	setHgtFileInfoPurgeThreshold,
	setHgtInterpolation,
	setHgtReadFileRate,
	setInitialized,
	setLayers,
	setMapsforgeGeneralAction,
	setMapsforgeProfiles,
	setRenderStylesCache,
} from './baseMapSlice';
import { startAppListening } from '../../listenerMiddleware';
import { selectInitialized } from './selectors';
import { MapsforgeGeneral } from './types';

const settingsKey = 'baseMapSettings';

/**
 * Loads settings from defaultPreferences and dispatches them to the store.
 *
 * Has to be called in index.js after the store got initialized.
 */
export const initializeFromStorage = (store: EnhancedStore) => {
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
				if (newSettings?.hgtDirPath) {
					store.dispatch(setHgtDirPath(newSettings.hgtDirPath));
				}
				if (newSettings?.hgtReadFileRate) {
					store.dispatch(setHgtReadFileRate(newSettings.hgtReadFileRate));
				}
				if (newSettings?.hgtInterpolation) {
					store.dispatch(setHgtInterpolation(newSettings.hgtInterpolation));
				}
				if (newSettings?.hgtFileInfoPurgeThreshold) {
					store.dispatch(
						setHgtFileInfoPurgeThreshold(newSettings.hgtFileInfoPurgeThreshold)
					);
				}
				if (newSettings?.mapsforgeGeneral) {
					store.dispatch(setMapsforgeGeneralAction(newSettings.mapsforgeGeneral));
				}
				if (newSettings?.renderStylesCache) {
					store.dispatch(setRenderStylesCache(newSettings.renderStylesCache));
				}
			}
			store.dispatch(setInitialized(true));
		})
		.catch((err) => 'ERROR' + console.log(err));
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
	DefaultPreference.set(settingsKey, JSON.stringify(settingsToSave));
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
		setHgtReadFileRate,
		setHgtInterpolation,
		setHgtFileInfoPurgeThreshold,
		setMapsforgeGeneralAction,
		setRenderStylesCache
	),
	effect: async (action: PayloadAction<any | { temp?: boolean }>, listenerApi) => {
		if (action.payload?.temp) {
			return;
		}
		saveToStorage(listenerApi.getState().baseMap, action.type);
	},
});
