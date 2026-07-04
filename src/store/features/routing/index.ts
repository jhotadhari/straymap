/**
 * Internal dependencies
 */
import { initializeFromStorage } from './connectStorage';
import { selectInitialized } from './selectors';
import de from './assets/i18n/de.json';
import en from './assets/i18n/en.json';
import es from './assets/i18n/es.json';
import pt from './assets/i18n/pt.json';
import { onSetDbPath } from './slice';
import RoutingMapView from './components/RoutingMapView';
import routingDrawerItem from '../drawers/items/routing';
import waypointsDrawerItem from '../drawers/items/waypoints';

export default {
	selectInitialized,
	initializeFromStorage,
	translation: {
		de,
		en,
		es,
		pt,
	},
	onSetDbPath,
	drawerItems: [routingDrawerItem, waypointsDrawerItem],
	mapViewComponents: [
		{
			key: 'routingMapView',
			Component: RoutingMapView,
			placement: 'inside-map',
			priority: 300,
		},
	],
};
