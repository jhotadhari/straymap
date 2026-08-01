/**
 * Internal dependencies
 */
import de from './assets/i18n/de.json';
import en from './assets/i18n/en.json';
import es from './assets/i18n/es.json';
import pt from './assets/i18n/pt.json';
import LinesImport from './uiItems/Import';

export default {
	selectInitialized: () => true,
	translation: {
		de,
		en,
		es,
		pt,
	},
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
