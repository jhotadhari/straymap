/**
 * Internal dependencies
 */
import React from 'react';
import MaterialIcons from '@react-native-vector-icons/material-icons/static';
import { initializeFromStorage } from './connectStorage';
import { selectInitialized } from './selectors';
import de from './assets/i18n/de.json';
import en from './assets/i18n/en.json';
import es from './assets/i18n/es.json';
import pt from './assets/i18n/pt.json';
import SettingsAppearance from '../ui/components/SettingsAppearance';
import Center from './components/Center';
import positionDrawerItem from '../drawers/items/position';

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
			key: 'appearance',
			label: 'ui.items.appearance',
			icon: ({ color, style }: { color: string; style: any }) =>
				React.createElement(MaterialIcons, { style, name: 'style', size: 25, color }),
			Component: SettingsAppearance,
			priority: 50,
		},
	],
	drawerItems: [positionDrawerItem],
	mapViewComponents: [
		{
			key: 'center',
			Component: Center,
			placement: 'sibling-overlay',
			priority: 100,
		},
	],
};
