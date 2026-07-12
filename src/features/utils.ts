/**
 * Internal dependencies
 */
import { AppStore } from '../store/store';
import { initializeFromStorage as initializeFromStorage_dbLoader } from './dbLoader/connectStorage';
import { initializeFromStorage as initializeFromStorage_updater } from './updater/connectStorage';
import { initializeFromStorage as initializeFromStorage_lang } from './lang/connectStorage';
import features from './index';

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
