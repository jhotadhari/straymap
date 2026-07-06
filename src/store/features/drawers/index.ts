/**
 * Internal dependencies
 */
import { createElement } from 'react';
import FeatherIcons from '@react-native-vector-icons/feather/static';

/**
 * Internal dependencies
 */
import { initializeFromStorage } from './connectStorage';
import { selectInitialized } from './selectors';
import de from './assets/i18n/de.json';
import en from './assets/i18n/en.json';
import es from './assets/i18n/es.json';
import pt from './assets/i18n/pt.json';
import SettingsDrawers from './uiItems/SettingsDrawers';
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
	uiItems: [
		{
			key: 'drawers',
			label: 'ui.items.drawers',
			icon: ({ color, style }: { color: string; style: any }) =>
				createElement(FeatherIcons, { style, name: 'sidebar', size: 25, color }),
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
	settingsPageKeys: [
		'drawers',
	],
};
