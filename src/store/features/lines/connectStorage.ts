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
	LinesSettings,
	LinesState,
	initialSettings,
	setInitialized,
	setSelected,
	setTableColumns,
	setSort,
	setFilters,
	setFilterLogic,
	upsertFilter,
	removeFilter,
	setTagsTableColumns,
	setTagsSort,
	setTagsFilters,
	setTagsFilterLogic,
	upsertTagsFilter,
	removeTagsFilter,
} from './slice';
import { startAppListening } from '../../listenerMiddleware';
import { selectInitialized } from './selectors';
import { AppStore } from '../../store';
import { logError } from '../../../lib/utils';
import { ensureSystemTagsExist } from './db/actionsTag';

const settingsKey = 'linesSettings';

/**
 * Loads settings from defaultPreferences and dispatches them to the store.
 */
export const initializeFromStorage = (store: AppStore) => {
	if (selectInitialized(store.getState())) {
		return;
	}
	// Ensure system-reserved tags exist in the database (idempotent).
	ensureSystemTagsExist().catch((err) => {
		logError('initializeFromStorage.ensureSystemTagsExist', err);
	});
	DefaultPreference.get(settingsKey)
		.then((newSettingsStr) => {
			if (newSettingsStr) {
				const newSettings = JSON.parse(newSettingsStr) as Partial<LinesState>;
				if (newSettings?.selected) {
					store.dispatch(setSelected(newSettings.selected));
				}
				if (newSettings?.linesTable?.tableColumns) {
					store.dispatch(setTableColumns(newSettings.linesTable!.tableColumns));
				}
				if (newSettings?.linesTable?.sort) {
					store.dispatch(setSort(newSettings.linesTable!.sort));
				}
				if (newSettings?.linesTable?.filters) {
					store.dispatch(setFilters(newSettings.linesTable!.filters));
				}
				if (newSettings?.linesTable?.filterLogic) {
					store.dispatch(setFilterLogic(newSettings.linesTable!.filterLogic));
				}
				if (newSettings?.tagsTable?.tableColumns) {
					store.dispatch(setTagsTableColumns(newSettings.tagsTable.tableColumns));
				}
				if (newSettings?.tagsTable?.sort) {
					store.dispatch(setTagsSort(newSettings.tagsTable.sort));
				}
				if (newSettings?.tagsTable?.filters) {
					store.dispatch(setTagsFilters(newSettings.tagsTable.filters));
				}
				if (newSettings?.tagsTable?.filterLogic) {
					store.dispatch(setTagsFilterLogic(newSettings.tagsTable.filterLogic));
				}
			}
			store.dispatch(setInitialized(true));
		})
		.catch((err) => logError('lines/connectStorage', err));
};

/**
 * Compares settings in this store slice with initialSettings,
 * and saves anything that differs to initialSettings to defaultPreferences.
 */
export const saveToStorage = (linesState: LinesState, actionType: string) => {
	if (!linesState.initialized) {
		return;
	}
	const settingsToSave: Partial<LinesSettings> = {};
	Object.keys(initialSettings).forEach((key) => {
		let shouldSave = false;
		let valueToSave;
		switch (key) {
			default:
				valueToSave = get(linesState, key);
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
		setSelected,
		setTableColumns,
		setSort,
		setFilters,
		setFilterLogic,
		upsertFilter,
		removeFilter,
		setTagsTableColumns,
		setTagsSort,
		setTagsFilters,
		setTagsFilterLogic,
		upsertTagsFilter,
		removeTagsFilter
	),
	effect: async (action, listenerApi) => {
		try {
			await saveToStorage(listenerApi.getState().lines, action.type);
		} catch (err) {
			logError('saveToStorage', err);
		}
	},
});
