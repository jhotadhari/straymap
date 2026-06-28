#!/usr/bin/env node

const path = require('path');
const tsx = require('tsx/cjs/api');

const { publish } = tsx.require(path.resolve(__dirname, './publish.ts'), __filename);

publish().catch((err) => {
	console.error(err.message);
	process.exit(1);
});
