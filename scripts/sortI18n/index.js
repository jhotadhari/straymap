#!/usr/bin/env node

const path = require('path');
const tsx = require('tsx/cjs/api');

const { sortI18n } = tsx.require(path.resolve(__dirname, './sortI18n.ts'), __filename);

try {
	sortI18n();
} catch (err) {
	console.error(err?.message ?? err);
	process.exit(1);
}
