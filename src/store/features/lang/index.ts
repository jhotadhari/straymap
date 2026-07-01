/**
 * Internal dependencies
 */
import { selectInitialized } from './selectors';
import de from './assets/i18n/de.json';
import en from './assets/i18n/en.json';

export default {
	selectInitialized,
	// initializeFromStorage, // don't export that because it has to be called explicitly
	translation: {
		de,
		en,
	},
};
