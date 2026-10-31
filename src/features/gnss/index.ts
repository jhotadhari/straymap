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
import GnssCenterConnection from './mapComponents/GnssCenterConnection';
import GnssCenterMarker from './mapComponents/GnssCenterMarker';
import GnssLabelShortSource from './mapContextMenuSources/GnssLabelShortSource';

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
		},
	],
	dashboardWidgets: [
		gnssCoordinates,
		gnssAccuracy,
		gnssAltitude,
		gnssSpeed,
	],
	mapComponents: [
		{
			key: 'gnssCenterConnection',
			Component: GnssCenterConnection,
			priority: 250,
		},
		{
			key: 'gnssCenterMarker',
			Component: GnssCenterMarker,
			priority: 250,
		},
	],
	mapContextMenuSources: [
		{
			key: 'gnssLabelShort',
			press: 'short',
			priority: 310,
			SourceComponent: GnssLabelShortSource,
		},
	],
	settingsPages: [
		{
			key: 'location',
			uiItemKey: 'location',
		},
	],
};
