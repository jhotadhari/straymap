/**
 * External dependencies
 */
import { isAnyOf } from '@reduxjs/toolkit';
import DefaultPreference from 'react-native-default-preference';
import { get, isEqual, set } from 'lodash-es';

/**
 * Internal dependencies
 */
import {
	ImportSettings,
	ImportState,
	initialSettings,
	setAutoCustomDate,
	setDatePatterns,
	setDryRun,
	setKeepAppActive,
	setFileLimit,
	setInitialized,
	setMergeMode,
	setOverwriteMode,
	setTagMode,
	setTagRegex,
	setTitleMode,
	setTitleRegex,
} from './slice';
import { startAppListening } from '../../store/listenerMiddleware';
import { selectInitialized } from './selectors';
import { AppStore } from '../../store/store';
import { logError } from '../../lib/utils';

const settingsKey = 'importSettings';

export const initializeFromStorage = (store: AppStore) => {
	if (selectInitialized(store.getState())) {
		return;
	}
	DefaultPreference.get(settingsKey)
		.then((newSettingsStr) => {
			if (newSettingsStr) {
				const newSettings = JSON.parse(newSettingsStr) as Partial<ImportState>;
			if (newSettings?.datePatterns) {
				store.dispatch(setDatePatterns(newSettings.datePatterns));
			}
			if (newSettings?.autoCustomDate != null) {
				store.dispatch(setAutoCustomDate(newSettings.autoCustomDate));
			}
			if (newSettings?.mergeMode != null) {
				store.dispatch(setMergeMode(newSettings.mergeMode));
			}
			if (newSettings?.overwriteMode != null) {
				store.dispatch(setOverwriteMode(newSettings.overwriteMode));
			}
			if (newSettings?.dryRun != null) {
				store.dispatch(setDryRun(newSettings.dryRun));
			}
			if (newSettings?.keepAppActive != null) {
				store.dispatch(setKeepAppActive(newSettings.keepAppActive));
			}
			if (newSettings?.fileLimit != null) {
				store.dispatch(setFileLimit(newSettings.fileLimit));
			}
			if (newSettings?.titleRegex != null) {
				store.dispatch(setTitleRegex(newSettings.titleRegex));
			}
			if (newSettings?.titleMode) {
				store.dispatch(setTitleMode(newSettings.titleMode));
			} else if (newSettings?.titleRegex) {
				store.dispatch(setTitleMode('regex'));
			}
			if (newSettings?.tagMode) {
				store.dispatch(setTagMode(newSettings.tagMode));
			}
			if (newSettings?.tagRegex != null) {
				store.dispatch(setTagRegex(newSettings.tagRegex));
			}
			}
			store.dispatch(setInitialized(true));
		})
		.catch((err) => logError('import/connectStorage', err));
};

export const saveToStorage = (importState: ImportState, actionType: string) => {
	if (!importState.initialized) {
		return;
	}
	const settingsToSave: Partial<ImportSettings> = {};
	Object.keys(initialSettings).forEach((key) => {
		const valueToSave = get(importState, key);
		const defaultValue = get(initialSettings, key);
		const shouldSave = !isEqual(valueToSave, defaultValue);
		if (shouldSave) {
			set(settingsToSave, key, valueToSave);
		}
	});
	if (__DEV__ && globalThis.shouldLog.saveToStorage) {
		console.log('DEBUG saveToStorage', settingsKey, actionType, settingsToSave);
	}
	return DefaultPreference.set(settingsKey, JSON.stringify(settingsToSave));
};

startAppListening({
	matcher: isAnyOf(
		setDatePatterns,
		setAutoCustomDate,
		setMergeMode,
		setOverwriteMode,
		setDryRun,
		setKeepAppActive,
		setFileLimit,
		setTitleMode,
		setTitleRegex,
		setTagMode,
		setTagRegex
	),
	effect: async (action, listenerApi) => {
		try {
			await saveToStorage(listenerApi.getState().import, action.type);
		} catch (err) {
			logError('saveToStorage', err);
		}
	},
});
