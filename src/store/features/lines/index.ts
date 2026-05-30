import { initializeFromStorage } from './connectStorage';
import { selectInitialized } from './selectors';
import de from './assets/i18n/de.json';
import en from './assets/i18n/de.json';
import * as schema from './db/schema/schema';

export default {
	selectInitialized,
	initializeFromStorage,
	translation: {
		de,
		en,
	},
	schema,
};
