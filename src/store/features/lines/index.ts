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
import LinesMapView from './mapComponents/LinesMapView';
import LinesBrowser from './uiItems/LinesBrowser';
import linesDrawerItem from './drawerPanels/lines';
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
	uiItems: [
		{
			key: 'linesBrowser',
			label: 'lines.linesBrowser',
			icon: 'go-kart-track',
			Component: LinesBrowser,
		},
	],
	drawerPanels: [linesDrawerItem],
	mapComponents: [
		{
			key: 'linesMapView',
			Component: LinesMapView,
			priority: 200,
		},
		{
			key: 'lineEditModal',
			Component: LineEditModalWrapper,
			priority: 500,
		},
	],
	settingsPages: [
		{
			key: 'linesBrowser',
			uiItemKey: 'linesBrowser',
		}
	],
	systemTagLabels: ['imported'],
};
