import { globSync } from 'glob';
import path from 'path';
import { readFileSync, writeFileSync, lstatSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

import { SUPPORTED_LANGUAGES, FALLBACK_LANGUAGE } from '../../src/assets/i18n/constants';
import { sortDeep } from '../../src/lib/utilsLight';

const SLICES_PATH = '../../src/store/features';

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
		...[...slices].map((slice) => '../../src/store/features/' + slice + '/assets/i18n/'),
	].forEach((langPath) => {
		// Load dataLang for fallback language.
		const fileLangFallback = path.resolve(__dirname, langPath + FALLBACK_LANGUAGE + '.json');
		const dataLangFallback = JSON.parse(readFileSync(fileLangFallback, 'utf8'));

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
				writeFileSync(file, JSON.stringify(dataLangSorted, null, '\t'), 'utf8');
				writeFileSync(
					fileLangFallback,
					JSON.stringify(dataLangFallback, null, '\t'),
					'utf8'
				);
			});
		});
	});
};
