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
import BaseMapIcon from './components/BaseMapIcon';

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
			icon: BaseMapIcon,
			Component: SettingsMaps,
		},
	],
	drawerPanels: [mapsDrawerItem],
	mapComponents: [
		{
			key: 'baseMap',
			Component: BaseMap,
			priority: 100,
		},
	],
	mapCornerComponents: [
		{
			key: 'mapLayersAttribution',
			Component: MapLayersAttribution,
			priority: 100,
		},
	],
	settingsPages: [
		{
			key: 'maps',
			uiItemKey: 'maps',
		},
	],
};
