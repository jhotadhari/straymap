/**
 * Internal dependencies
 */
import { initializeFromStorage } from './connectStorage';
import { selectInitialized } from './selectors';
import de from './assets/i18n/de.json';
import en from './assets/i18n/en.json';
import es from './assets/i18n/es.json';
import pt from './assets/i18n/pt.json';
import HardwareKeyControl from './components/controls/HardwareKeyControl';
import UnitPrefControl from './components/controls/UnitPrefControl';
import HgtControl from './components/controls/HgtControl';

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
			key: 'hardwareKey',
			label: 'general.hardwareKeys',
			Control: HardwareKeyControl,
			priority: 20,
		},
		{
			key: 'unitPref',
			label: 'general.unitPref',
			Control: UnitPrefControl,
			priority: 30,
		},
		{
			key: 'hgt',
			label: 'general.hgtSettings',
			Control: HgtControl,
			priority: 40,
		},
	],
};
