/**
 * Internal dependencies
 */
// import { initializeFromStorage } from './connectStorage';
import { selectInitialized } from './selectors';
import de from './assets/i18n/de.json';
import en from './assets/i18n/en.json';
import es from './assets/i18n/es.json';
import pt from './assets/i18n/pt.json';
import SettingsDatabase from './uiItems/SettingsDatabase';

export default {
	selectInitialized,
	// initializeFromStorage, // don't export that because it has to be called explicitly
	translation: {
		de,
		en,
		es,
		pt,
	},
	uiItems: [
		{
			key: 'database',
			label: 'dbLoader.database',
			icon: 'database-outline',
			Component: SettingsDatabase,
		},
	],
	settingsPages: [
		{
			key: 'database',
			uiItemKey: 'database',
			priority: 2500,
		},
	],
};
