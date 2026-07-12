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
import TagsBrowser from './uiItems/TagsBrowser';
import linesDrawerItem from './drawerPanels/lines';
import LineEditModalWrapper from './components/LineEditModalWrapper';
import TagBadgeModeControl from './components/controls/TagBadgeModeControl';

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
		{
			key: 'tagEdit',
			label: 'lines.tagsBrowser',
			icon: 'tag-outline',
			Component: TagsBrowser,
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
		},
		{
			key: 'tagEdit',
			uiItemKey: 'tagEdit',
		},
	],
	settingsControls: [
		{
			key: 'tagBadgeMode',
			label: 'lines.tagBadgeMode',
			Control: TagBadgeModeControl,
		},
	],
	systemTagLabels: ['imported'],
};
