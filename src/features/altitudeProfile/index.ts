/**
 * Internal dependencies
 */
import de from './assets/i18n/de.json';
import en from './assets/i18n/en.json';
import es from './assets/i18n/es.json';
import pt from './assets/i18n/pt.json';
import { registerAltitudeProfileItemResolver } from './resolver';

// Register the bottomDrawer item resolver at module scope: features are
// imported by features/index.ts before the app renders, so the resolver is
// in place for the first render.
registerAltitudeProfileItemResolver();

export default {
	selectInitialized: () => true,
	translation: {
		de,
		en,
		es,
		pt,
	},
};
