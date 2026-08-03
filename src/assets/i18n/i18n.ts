/**
 * External dependencies
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { difference } from 'lodash-es';
import { I18nManager } from 'react-native';

/**
 * Internal dependencies
 */
import en from './en.json';
import de from './de.json';
import es from './es.json';
import pt from './pt.json';
import { SUPPORTED_LANGUAGES, FALLBACK_LANGUAGE, LANGUAGE_NAMES } from './constants';
import features from '../../features';
import {
	en as paperDatesEn,
	de as paperDatesDe,
	es as paperDatesEs,
	pt as paperDatesPt,
	registerTranslation,
} from 'react-native-paper-dates';
import { logError } from '../../lib/utils';

registerTranslation('en', paperDatesEn);
registerTranslation('de', paperDatesDe);
registerTranslation('es', paperDatesEs);
registerTranslation('pt', paperDatesPt);

const resources = SUPPORTED_LANGUAGES.reduce(
	(accL, lang) => {
		accL[lang] = {
			translation: {
				...{
					de,
					en,
					es,
					pt,
				}[lang],
				...Object.keys(features).reduce(
					(acc, featureKey) => {
						acc[featureKey] = features[featureKey].translation[lang];
						return acc;
					},
					{} as { [featureKey: string]: any }
				),
			},
		};
		return accL;
	},
	{} as { [lang: string]: any }
);

const intiOptions = {
	lng: FALLBACK_LANGUAGE,
	fallbackLng: FALLBACK_LANGUAGE,
	resources,
	interpolation: {
		escapeValue: false, // react already safes from xss
	},
	debug: shouldLog.i18n,
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
 * Resolve a language key (e.g. 'system', 'de') to a supported locale.
 * 'system' resolves to the device locale, falling back to FALLBACK_LANGUAGE.
 */
export const resolveLocale = (lang: string): string => {
	if (([...SUPPORTED_LANGUAGES] as string[]).includes(lang)) return lang;
	const deviceLang =
		(I18nManager.getConstants().localeIdentifier || '').split('_')[0] || FALLBACK_LANGUAGE;
	return (([...SUPPORTED_LANGUAGES] as string[]).includes(deviceLang)
		? deviceLang
		: FALLBACK_LANGUAGE) as string;
};

/**
 * Function to change the i18n language
 *
 * @param   {string}  newLang  	Key of new lang.
 * 								If not one of SUPPORTED_LANGUAGES ( eg. 'system')
 * 								it will fallback to system,m lang or FALLBACK_LANGUAGE.
 */
export const changeLang = (newLang: string) => {
	const lang = resolveLocale(newLang);
	i18n.changeLanguage(lang).catch((err) => logError('i18n.changeLang', err));
};

export default i18n;
