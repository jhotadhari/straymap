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
import en from './en.json';
import de from './de.json';
import { SUPPORTED_LANGUAGES, FALLBACK_LANGUAGE, LANGUAGE_NAMES } from './constants';
import features from '../../store/features';
import { logError } from '../../lib/utils';

const resources = SUPPORTED_LANGUAGES.reduce(
	(accL, lang) => {
		accL[lang] = {
			translation: {
				...{
					de,
					en,
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
	i18n.changeLanguage(lang).catch((err) => logError('i18n.changeLang', err));
};

export default i18n;
