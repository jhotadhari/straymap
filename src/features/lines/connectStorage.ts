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
	setTagBadgeMode,
	setUseSimplification,
	setLinesTableColumns,
	setLinesSort,
	setLinesFilters,
	setLinesFilterLogic,
	upsertLinesFilter,
	removeLinesFilter,
	setTagsTableColumns,
	setTagsSort,
	setTagsFilters,
	setTagsFilterLogic,
	upsertTagsFilter,
	removeTagsFilter,
	setLineColors,
} from './slice';
import { startAppListening } from '../../store/listenerMiddleware';
import { selectInitialized } from './selectors';
import { AppStore } from '../../store/store';
import { logError } from '../../lib/utils';
import { ensureSystemTagsExist } from './db/actionsTag';

const settingsKey = 'linesSettings';

/**
 * Loads settings from defaultPreferences and dispatches them to the store.
 */
export const initializeFromStorage = async (store: AppStore): Promise<boolean> => {
	if (selectInitialized(store.getState())) {
		return false;
	}
	// Ensure system-reserved tags exist in the database (idempotent).
	// Await so that setInitialized(true) is only dispatched after
	// system tags are committed — consumers that query tags on mount
	// will see them.
	try {
		await ensureSystemTagsExist();
	} catch (err) {
		logError('initializeFromStorage.ensureSystemTagsExist', err);
	}
	try {
		const newSettingsStr = await DefaultPreference.get(settingsKey);
		if (newSettingsStr) {
			const newSettings = JSON.parse(newSettingsStr) as Partial<LinesState>;
			if (newSettings?.selected) {
				store.dispatch(setSelected(newSettings.selected));
			}
			if (newSettings?.linesTable?.tableColumns) {
				store.dispatch(setLinesTableColumns(newSettings.linesTable!.tableColumns));
			}
			if (newSettings?.linesTable?.sort) {
				store.dispatch(setLinesSort(newSettings.linesTable!.sort));
			}
			if (newSettings?.linesTable?.filters) {
				store.dispatch(setLinesFilters(newSettings.linesTable!.filters));
			}
			if (newSettings?.linesTable?.filterLogic) {
				store.dispatch(setLinesFilterLogic(newSettings.linesTable!.filterLogic));
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
		if (newSettings?.tagBadgeMode) {
			store.dispatch(setTagBadgeMode(newSettings.tagBadgeMode));
		}
		if (newSettings?.useSimplification !== undefined) {
			store.dispatch(setUseSimplification(newSettings.useSimplification));
		}
		if (newSettings?.lineColors) {
			store.dispatch(setLineColors(newSettings.lineColors));
		}
		}
		store.dispatch(setInitialized(true));
	} catch (err) {
		logError('lines/connectStorage', err);
	}
	return true;
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
		setTagBadgeMode,
		setUseSimplification,
		setLinesTableColumns,
		setLinesSort,
		setLinesFilters,
		setLinesFilterLogic,
		upsertLinesFilter,
		removeLinesFilter,
		setTagsTableColumns,
		setTagsSort,
		setTagsFilters,
		setTagsFilterLogic,
		upsertTagsFilter,
		removeTagsFilter,
		setLineColors
	),
	effect: async (action, listenerApi) => {
		try {
			await saveToStorage(listenerApi.getState().lines, action.type);
		} catch (err) {
			logError('saveToStorage', err);
		}
	},
});
