/**
 * Internal dependencies
 */
import { initializeFromStorage } from './connectStorage';
import { selectInitialized } from './selectors';
import de from './assets/i18n/de.json';
import en from './assets/i18n/en.json';
import es from './assets/i18n/es.json';
import pt from './assets/i18n/pt.json';
import SettingsDrawers from './settingsPages/SettingsDrawers';
import Drawers from './appOverlays/Drawers';

export default {
	selectInitialized,
	initializeFromStorage,
	translation: {
		de,
		en,
		es,
		pt,
	},
	settingsPages: [
		{
			key: 'drawers',
			label: 'ui.items.drawers',
			icon: 'cog',
			Component: SettingsDrawers,
			priority: 60,
		},
	],
	appOverlays: [
		{
			key: 'drawers',
			Component: Drawers,
			priority: 200,
		},
	],
};
