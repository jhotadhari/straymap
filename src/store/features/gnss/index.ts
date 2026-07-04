/**
 * Internal dependencies
 */
import { initializeFromStorage } from './connectStorage';
import { selectInitialized, selectIsActive } from './selectors';
import de from './assets/i18n/de.json';
import en from './assets/i18n/en.json';
import es from './assets/i18n/es.json';
import pt from './assets/i18n/pt.json';
import gpsCoordinates from './elements/gpsCoordinates';
import gpsAccuracy from './elements/gpsAccuracy';
import gpsAltitude from './elements/gpsAltitude';
import gpsSpeed from './elements/gpsSpeed';
import gpsDrawerItem from './drawerItems/gpsDrawerItem';

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
	dashboardElements: [
		gpsCoordinates,
		gpsAccuracy,
		gpsAltitude,
		gpsSpeed,
	],
	drawerItems: [
		gpsDrawerItem,
	],
};
