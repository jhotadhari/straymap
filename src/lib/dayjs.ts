/**
 * External dependencies
 */
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { difference } from 'lodash-es';

/**
 * Internal dependencies
 */
import { SUPPORTED_LANGUAGES } from '../assets/i18n/constants';

/**
 * Locale bundles
 */
import de from 'dayjs/locale/de';
import en from 'dayjs/locale/en';
import es from 'dayjs/locale/es';
import pt from 'dayjs/locale/pt';

dayjs.extend(customParseFormat);

const localeMap = { de, en, es, pt };
Object.entries(localeMap).forEach(([, locale]) =>
	dayjs.locale(locale, undefined, true)
);

if (__DEV__) {
	const onlyInLocales = difference(Object.keys(localeMap), [...SUPPORTED_LANGUAGES]);
	const onlyInSupported = difference([...SUPPORTED_LANGUAGES], Object.keys(localeMap));
	if (onlyInLocales.length > 0) {
		console.warn(
			'[dayjs] locale entries not in SUPPORTED_LANGUAGES:',
			onlyInLocales
		);
	}
	if (onlyInSupported.length > 0) {
		console.warn(
			'[dayjs] SUPPORTED_LANGUAGES missing dayjs locale:',
			onlyInSupported
		);
	}
}

export const setDayjsLocale = (lang: string) => {
	const key = ([...SUPPORTED_LANGUAGES] as string[]).includes(lang) ? lang : 'en';
	dayjs.locale(key);
};

export default dayjs;
