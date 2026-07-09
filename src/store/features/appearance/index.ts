/**
 * Internal dependencies
 */
import { initializeFromStorage } from './connectStorage';
import { selectInitialized } from './selectors';
import de from './assets/i18n/de.json';
import en from './assets/i18n/en.json';
import es from './assets/i18n/es.json';
import pt from './assets/i18n/pt.json';
import Center from './appOverlays/Center';
import CenterControl from './components/controls/CenterControl';
import ThemeControl from './components/controls/ThemeControl';

export default {
	selectInitialized,
	initializeFromStorage,
	translation: {
		de,
		en,
		es,
		pt,
	},
	settingsControls: [

		{
			key: 'theme',
			label: 'appearance.theme',
			Control: ThemeControl,
			priority: 50,
		},


		{
			key: 'center',
			label: 'appearance.cursor',
			Control: CenterControl,
			priority: 100,

		},
	],
	appOverlays: [
		{
			key: 'center',
			Component: Center,
			priority: 50,
		},
	],
};
