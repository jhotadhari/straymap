/**
 * External dependencies
 */
import { createElement } from 'react';
import MaterialIcons from '@react-native-vector-icons/material-icons/static';

/**
 * Internal dependencies
 */
import { initializeFromStorage } from './connectStorage';
import { selectInitialized } from './selectors';
import de from './assets/i18n/de.json';
import en from './assets/i18n/en.json';
import es from './assets/i18n/es.json';
import pt from './assets/i18n/pt.json';
import Settings from './uiItems/Settings';
import SettingsControls from './uiItems/SettingsControls';
import About from './uiItems/About';

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
			key: 'settings',
			label: 'ui.items.settings',
			Component: Settings,
			priority: 10,
		},
		{
			key: 'general',
			label: 'ui.items.general',
			icon: 'application-cog-outline',
			Component: SettingsControls,
			priority: 20,
		},
		{
			key: 'about',
			label: 'ui.items.about',
			icon: ({ color, style }: { color: string; style: any }) =>
				createElement(MaterialIcons, {
					style,
					name: 'info-outline',
					size: 25,
					color,
				}),
			Component: About,
			priority: 90,
		},
	],
	settingsPageKeys: [
		'general',
		'about',
	],
};
