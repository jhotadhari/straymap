/**
 * Internal dependencies
 */
import { initializeFromStorage } from './connectStorage';
import { selectInitialized } from './selectors';
import de from './assets/i18n/de.json';
import en from './assets/i18n/en.json';
import es from './assets/i18n/es.json';
import pt from './assets/i18n/pt.json';
import BottomDrawer from './appOverlays/BottomDrawer';
import example from './bottomDrawerItems/example';

export default {
	selectInitialized,
	initializeFromStorage,
	translation: {
		de,
		en,
		es,
		pt,
	},
	bottomDrawerItems: [example],
	appOverlays: [
		{
			key: 'bottomDrawer',
			Component: BottomDrawer,
			priority: 90,
		},
	],
};
