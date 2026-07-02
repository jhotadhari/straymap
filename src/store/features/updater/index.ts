/**
 * Internal dependencies
 */
import { selectInitialized } from './selectors';
import de from './assets/i18n/de.json';
import en from './assets/i18n/en.json';
import es from './assets/i18n/es.json';
import pt from './assets/i18n/pt.json';

export default {
	selectInitialized,
	// initializeFromStorage, // don't export that because it has to be called explicitly
	translation: {
		de,
		en,
		es,
		pt,
	},
};
