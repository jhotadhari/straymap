/**
 * Internal dependencies
 */
import { selectInitialized } from './selectors';
import de from './assets/i18n/de.json';
import en from './assets/i18n/en.json';
import es from './assets/i18n/es.json';
import pt from './assets/i18n/pt.json';
import MapContextMenuOverlay from './MapContextMenuOverlay';
import MapGeneralSource from './mapContextMenuSources/MapGeneralSource';

export default {
	selectInitialized,
	translation: {
		de,
		en,
		es,
		pt,
	},
	appOverlays: [
		{
			key: 'mapContextMenu',
			Component: MapContextMenuOverlay,
			priority: 1000,
		},
	],
	mapContextMenuSources: [
		{
			key: 'mapGeneral',
			press: 'long',
			SourceComponent: MapGeneralSource,
		},
	],
};
