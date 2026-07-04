/**
 * Internal dependencies
 */
import { initializeFromStorage } from './connectStorage';
import { selectInitialized } from './selectors';
import de from './assets/i18n/de.json';
import en from './assets/i18n/en.json';
import es from './assets/i18n/es.json';
import pt from './assets/i18n/pt.json';
import SettingsDrawers from '../ui/components/SettingsDrawers';
import Drawers from './components/Drawers';

export default {
	selectInitialized,
	initializeFromStorage,
	translation: {
		de,
		en,
		es,
		pt,
	},
	settingsItems: [
		{
			key: 'drawers',
			label: 'ui.items.drawers',
			icon: 'cog',
			Component: SettingsDrawers,
			priority: 60,
		},
	],
	mapViewComponents: [
		{
			key: 'drawers',
			Component: Drawers,
			placement: 'sibling-overlay',
			priority: 200,
		},
	],
};
