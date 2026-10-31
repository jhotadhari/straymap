/**
 * Internal dependencies
 */
import { selectInitialized } from './selectors';
import de from './assets/i18n/de.json';
import en from './assets/i18n/en.json';
import es from './assets/i18n/es.json';
import pt from './assets/i18n/pt.json';
import MeasureMarker from './mapComponents/MeasureMarker';
import MeasureLine from './mapComponents/MeasureLine';
import MeasureLineLabel from './mapComponents/MeasureLineLabel';
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
			key: 'measureLine',
			Component: MeasureLine,
			priority: 250,
		},
		{
			key: 'measureLineLabel',
			Component: MeasureLineLabel,
			priority: 251,
		},
		{
			key: 'measureMarker',
			Component: MeasureMarker,
			priority: 250,
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
