/**
 * Internal dependencies
 */
import { initializeFromStorage } from './connectStorage';
import { selectInitialized } from './selectors';
import de from './assets/i18n/de.json';
import en from './assets/i18n/en.json';
import es from './assets/i18n/es.json';
import pt from './assets/i18n/pt.json';
import SettingsMaps from './uiItems/SettingsMaps';
import BaseMap from './mapComponents/BaseMap/index';
import MapLayersAttribution from './mapComponents/MapLayersAttribution';
import mapsDrawerItem from './drawerPanels/maps';

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
			key: 'maps',
			label: 'ui.items.maps',
			icon: 'map',
			Component: SettingsMaps,
			priority: 30,
		},
	],
	drawerPanels: [mapsDrawerItem],
	mapComponents: [
		{
			key: 'baseMap',
			Component: BaseMap,
			priority: 100,
		},
		{
			key: 'mapLayersAttribution',
			Component: MapLayersAttribution,
			priority: 300,
		},
	],
	settingsPageKeys: [
		'maps',
	],
};
