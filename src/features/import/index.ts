/**
 * Internal dependencies
 */
import de from './assets/i18n/de.json';
import en from './assets/i18n/en.json';
import es from './assets/i18n/es.json';
import pt from './assets/i18n/pt.json';
import LinesImport from './uiItems/Import';
import { selectInitialized } from './selectors';
import { initializeFromStorage } from './connectStorage';

export default {
	selectInitialized,
	translation: {
		de,
		en,
		es,
		pt,
	},
	initializeFromStorage,
	uiItems: [
		{
			key: 'import',
			label: 'import.title',
			icon: 'database-import',
			Component: LinesImport,
		},
	],
	settingsPages: [
		{
			key: 'import',
			uiItemKey: 'import',
			priority: 1500,
		},
	],
};
