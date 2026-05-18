/**
 * External dependencies
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { difference, get } from 'lodash-es';
import { I18nManager } from 'react-native';

/**
 * Internal dependencies
 */
import en_ from './en.json';
import en_appearance from '../../store/features/appearance/assets/i18n/en.json';
import en_baseMap from '../../store/features/baseMap/assets/i18n/en.json';
import en_dashboard from '../../store/features/dashboard/assets/i18n/en.json';
import en_dirs from '../../store/features/dirs/assets/i18n/en.json';
import en_drawers from '../../store/features/drawers/assets/i18n/en.json';
import en_general from '../../store/features/general/assets/i18n/en.json';
import en_ui from '../../store/features/ui/assets/i18n/en.json';
import en_updater from '../../store/features/updater/assets/i18n/en.json';
import en_lang from '../../store/features/lang/assets/i18n/en.json';
import de_ from './en.json';
import de_appearance from '../../store/features/appearance/assets/i18n/de.json';
import de_baseMap from '../../store/features/baseMap/assets/i18n/de.json';
import de_dashboard from '../../store/features/dashboard/assets/i18n/de.json';
import de_dirs from '../../store/features/dirs/assets/i18n/de.json';
import de_drawers from '../../store/features/drawers/assets/i18n/de.json';
import de_general from '../../store/features/general/assets/i18n/de.json';
import de_ui from '../../store/features/ui/assets/i18n/de.json';
import de_updater from '../../store/features/updater/assets/i18n/de.json';
import de_lang from '../../store/features/lang/assets/i18n/de.json';
import { SUPPORTED_LANGUAGES, FALLBACK_LANGUAGE, LANGUAGE_NAMES } from './constants';

const en = {
	translation: {
		...en_,
		appearance: en_appearance,
		baseMap: en_baseMap,
		dashboard: en_dashboard,
		dirs: en_dirs,
		drawers: en_drawers,
		general: en_general,
		ui: en_ui,
		updater: en_updater,
		lang: en_lang,
	},
};

const de = {
	translation: {
		...de_,
		appearance: de_appearance,
		baseMap: de_baseMap,
		dashboard: de_dashboard,
		dirs: de_dirs,
		drawers: de_drawers,
		general: de_general,
		ui: de_ui,
		updater: de_updater,
		lang: de_lang,
	},
};

const intiOptions = {
	lng: FALLBACK_LANGUAGE,
	fallbackLng: FALLBACK_LANGUAGE,
	resources: {
		en,
		de,
	},
	interpolation: {
		escapeValue: false, // react already safes from xss
	},
};

// Prompt console error if langs misconfigured.
if (__DEV__) {
	const missingLangs = difference(Object.keys(intiOptions.resources), SUPPORTED_LANGUAGES);
	if (missingLangs.length > 0) {
		console.error('Mismatch SUPPORTED_LANGUAGES and i18n resources', missingLangs);
	}
	const missingLangNames = difference(
		Object.keys(intiOptions.resources),
		Object.keys(LANGUAGE_NAMES)
	);
	if (missingLangNames.length > 0) {
		console.error('Mismatch LANGUAGE_NAMES and i18n resources', missingLangNames);
	}
}

i18n.use(initReactI18next).init(intiOptions);

/**
 * Function to change the i18n language
 *
 * @param   {string}  newLang  	Key of new lang.
 * 								If not one of SUPPORTED_LANGUAGES ( eg. 'system')
 * 								it will fallback to system,m lang or FALLBACK_LANGUAGE.
 */
export const changeLang = (newLang: string) => {
	const systemLang = get(
		(I18nManager.getConstants().localeIdentifier || FALLBACK_LANGUAGE).split('_'),
		0,
		FALLBACK_LANGUAGE
	);
	const lang = ([...SUPPORTED_LANGUAGES] as string[]).includes(newLang)
		? newLang
		: (([...SUPPORTED_LANGUAGES] as string[]).find((langKey) => langKey === systemLang) ??
			FALLBACK_LANGUAGE);
	i18n.changeLanguage(lang).catch((err) => 'ERROR' + console.log(err));
};

export default i18n;
