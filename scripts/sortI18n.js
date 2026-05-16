#!/usr/bin/env node

const { globSync } = require('glob');
const path = require('path');
const { readFileSync, writeFileSync } = require('fs');
const tsx = require('tsx/cjs/api');

// Load languages from constants.
const { SUPPORTED_LANGUAGES, FALLBACK_LANGUAGE } = tsx.require(
	path.resolve(__dirname, '../src/assets/i18n/constants.ts'),
	__filename
);

// Load utils
const { sortDeep } = tsx.require(path.resolve(__dirname, '../src/lib/utilsGeneral.ts'), __filename);

const slicesPath = '../src/store/features';
const slices = globSync(path.resolve(__dirname, slicesPath + '/*')).map((file) => {
	return file.replace(path.resolve(__dirname, slicesPath) + '/', '');
});

[
	'../src/assets/i18n/',
	...[...slices].map((slice) => '../src/store/features/' + slice + '/assets/i18n/'),
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
			writeFileSync(
				file,
				JSON.stringify(dataLangSorted, null, '\t'),
				'utf8',
				(err) => err && console.log(err)
			);
			writeFileSync(
				fileLangFallback,
				JSON.stringify(dataLangFallback, null, '\t'),
				'utf8',
				(err) => err && console.log(err)
			);
		});
	});
});
