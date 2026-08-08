#!/usr/bin/env node

const path = require('path');
const tsx = require('tsx/cjs/api');

async function main() {
	const { buildIcons } = tsx.require(path.resolve(__dirname, './buildIcons.ts'), __filename);
	await buildIcons();
}

main().catch((err) => {
	console.error(err?.message ?? err);
	process.exit(1);
});
