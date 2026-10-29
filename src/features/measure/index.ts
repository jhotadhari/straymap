/**
 * Internal dependencies
 */
import { selectInitialized } from './selectors';
import de from './assets/i18n/de.json';
import en from './assets/i18n/en.json';
import es from './assets/i18n/es.json';
import pt from './assets/i18n/pt.json';
import MeasureMarker from './mapComponents/MeasureMarker';
import MeasureOverlay from './appOverlays/MeasureOverlay';
import MeasureShortSource from './mapContextMenuSources/MeasureShortSource';

export default {
	selectInitialized,
	translation: {
		de,
		en,
		es,
		pt,
	},
	mapComponents: [
		{
			key: 'measureMarker',
			Component: MeasureMarker,
			priority: 250,
		},
	],
	appOverlays: [
		{
			key: 'measureOverlay',
			Component: MeasureOverlay,
			priority: 100,
		},
	],
	mapContextMenuSources: [
		{
			key: 'measureShort',
			press: 'short',
			priority: 300,
			SourceComponent: MeasureShortSource,
		},
	],
};
