/**
 * Internal dependencies
 */
import { initializeFromStorage } from './connectStorage';
import { selectInitialized } from './selectors';
import de from './assets/i18n/de.json';
import en from './assets/i18n/en.json';
import es from './assets/i18n/es.json';
import pt from './assets/i18n/pt.json';
import SettingsMaps from '../ui/components/SettingsMaps';
import BaseMap from './components/BaseMap/index';
import MapLayersAttribution from './components/MapLayersAttribution';
import mapsDrawerItem from '../drawers/items/maps';

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
			key: 'maps',
			label: 'ui.items.maps',
			icon: 'map',
			Component: SettingsMaps,
			priority: 30,
		},
	],
	drawerItems: [mapsDrawerItem],
	mapViewComponents: [
		{
			key: 'baseMap',
			Component: BaseMap,
			placement: 'inside-map',
			priority: 100,
		},
		{
			key: 'mapLayersAttribution',
			Component: MapLayersAttribution,
			placement: 'sibling-overlay',
			priority: 300,
		},
	],
};
