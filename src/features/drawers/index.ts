/**
 * Internal dependencies
 */
import { createElement } from 'react';

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
import DrawersIcon from './components/DrawersIcon';
import { SETTINGS_HANDLE_KEY } from './constants';

export default {
	selectInitialized,
	initializeFromStorage,
	translation: {
		de,
		en,
		es,
		pt,
	},
	drawerPanels: [
		{
			key: SETTINGS_HANDLE_KEY,
			label: 'drawers.settingsHandle',
			iconSource: 'cog',
		},
	],
	uiItems: [
		{
			key: 'drawers',
			label: 'ui.items.drawers',
			icon: (props: { color: string; style: any }) => createElement(DrawersIcon, props),
			Component: SettingsDrawers,
		},
	],
	appOverlays: [
		{
			key: 'drawers',
			Component: Drawers,
			priority: 100,
		},
	],
	settingsPages: [
		{
			key: 'drawers',
			uiItemKey: 'drawers',
			priority: 2200,
		},
	],
};
