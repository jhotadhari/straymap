import { globSync } from 'glob';
import path from 'path';
import { readFileSync, writeFileSync, lstatSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

import { SUPPORTED_LANGUAGES, FALLBACK_LANGUAGE } from '../../src/assets/i18n/constants';
import { sortDeep } from '../../src/lib/utilsLight';

const SLICES_PATH = '../../src/features';

/**
 * Expand flat dot-notation keys ("a.b.c": value) into nested objects
 * ({"a": {"b": {"c": value}}}), merging with any existing nested keys.
 * This allows the fallback language to use flat keys while the sorter
 * treats them as nested for comparison with other languages.
 */
const expandDottedKeys = (obj: Record<string, any>): Record<string, any> => {
	const result = { ...obj };
	const dottedKeys = Object.keys(result).filter((k) => k.includes('.'));
	for (const key of dottedKeys) {
		const value = result[key];
		delete result[key];
		// Merge: if the target path already exists, merge shallow
		const parts = key.split('.');
		let current = result;
		for (let i = 0; i < parts.length - 1; i++) {
			if (current[parts[i]] === undefined || typeof current[parts[i]] !== 'object') {
				current[parts[i]] = {};
			}
			current = current[parts[i]];
		}
		current[parts[parts.length - 1]] = value;
	}
	return result;
};

export const sortI18n = () => {
	// console.log( 'debug SUPPORTED_LANGUAGES', SUPPORTED_LANGUAGES ); // debug

	const slices = globSync(path.resolve(__dirname, SLICES_PATH + '/*'))
		.map((file) => {
			return lstatSync(file).isDirectory()
				? file.replace(path.resolve(__dirname, SLICES_PATH) + '/', '')
				: undefined;
		})
		.filter((s) => !!s);

	[
		'../../src/assets/i18n/',
		...[...slices].map((slice) => '../../src/features/' + slice + '/assets/i18n/'),
	].forEach((langPath) => {
		// Load dataLang for fallback language.
		const fileLangFallback = path.resolve(__dirname, langPath + FALLBACK_LANGUAGE + '.json');
		let dataLangFallback = JSON.parse(readFileSync(fileLangFallback, 'utf8'));

		// Expand flat dot-notation keys to nested before sorting,
		// so that "a.b": val matches {"a": {"b": val}} in other
		// languages.
		dataLangFallback = expandDottedKeys(dataLangFallback);

		// Loop languages and process them according to fallback language
		[...SUPPORTED_LANGUAGES].map((lang) => {
			globSync(path.resolve(__dirname, langPath + lang + '.json')).forEach((file) => {
				if (FALLBACK_LANGUAGE === lang) {
					return;
				}
				const dataLang = JSON.parse(readFileSync(file, 'utf8'));
				const dataLangSorted = sortDeep(dataLang, dataLangFallback, {
					verbose: {
						objInputLabel: langPath + lang,
						objOrderLabel: langPath + FALLBACK_LANGUAGE,
					},
					strict: true,
				});
				writeFileSync(file, JSON.stringify(dataLangSorted, null, '\t') + '\n', 'utf8');
				writeFileSync(
					fileLangFallback,
					JSON.stringify(dataLangFallback, null, '\t') + '\n',
					'utf8'
				);
			});
		});
	});
};
