import { initializeFromStorage } from './connectStorage';
import { selectInitialized } from './selectors';
import de from './assets/i18n/de.json';
import en from './assets/i18n/en.json';
import { onSetDbPath } from './slice';

export default {
	selectInitialized,
	initializeFromStorage,
	translation: {
		de,
		en,
	},
	onSetDbPath,
};
