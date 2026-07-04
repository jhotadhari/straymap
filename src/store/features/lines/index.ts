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
import LinesMapView from './components/LinesMapView';
import LinesBrowser from '../ui/components/LinesBrowser';
import linesDrawerItem from '../drawers/items/lines';
import LineEditModalWrapper from './components/LineEditModalWrapper';

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
	settingsItems: [
		{
			key: 'linesBrowser',
			label: 'ui.items.linesBrowser',
			icon: 'go-kart-track',
			Component: LinesBrowser,
			priority: 70,
		},
	],
	drawerItems: [linesDrawerItem],
	mapViewComponents: [
		{
			key: 'linesMapView',
			Component: LinesMapView,
			placement: 'inside-map',
			priority: 200,
		},
		{
			key: 'lineEditModal',
			Component: LineEditModalWrapper,
			placement: 'sibling-overlay',
			priority: 500,
		},
	],
};
