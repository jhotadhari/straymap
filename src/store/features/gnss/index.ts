/**
 * Internal dependencies
 */
import { initializeFromStorage } from './connectStorage';
import { selectInitialized, selectIsActive } from './selectors';
import de from './assets/i18n/de.json';
import en from './assets/i18n/en.json';
import es from './assets/i18n/es.json';
import pt from './assets/i18n/pt.json';
import gnssCoordinates from './dashboardWidgets/gnssCoordinates';
import gnssAccuracy from './dashboardWidgets/gnssAccuracy';
import gnssAltitude from './dashboardWidgets/gnssAltitude';
import gnssSpeed from './dashboardWidgets/gnssSpeed';
import SettingsLocation from './uiItems/SettingsLocation';
import gnssDrawerItem from './drawerPanels/gnssDrawerItem';

export default {
	selectInitialized,
	initializeFromStorage,
	translation: {
		de,
		en,
		es,
		pt,
	},
	modes: ['location'],
	selectActiveModes: (state: any) => (selectIsActive(state) ? ['location'] : []),
	uiItems: [
		{
			key: 'location',
			label: 'ui.items.location',
			icon: 'crosshairs-gps',
			Component: SettingsLocation,
			priority: 25,
		},
	],
	dashboardWidgets: [
		gnssCoordinates,
		gnssAccuracy,
		gnssAltitude,
		gnssSpeed,
	],
	drawerPanels: [
		gnssDrawerItem,
	],
	settingsPageKeys: [
		'location',
	],
};
