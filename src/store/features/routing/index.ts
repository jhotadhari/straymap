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
import { selectIsRouting } from './selectors';
import RoutingMapView from './mapComponents/RoutingMapView';
import routingDrawerItem from './drawerPanels/routing';

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
	drawerPanels: [routingDrawerItem],
	mapComponents: [
		{
			key: 'routingMapView',
			Component: RoutingMapView,
			priority: 300,
		},
	],
	modes: ['routing'],
	selectActiveModes: (state: any) => (selectIsRouting(state) ? ['routing'] : []),
};
