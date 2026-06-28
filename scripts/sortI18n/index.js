#!/usr/bin/env node

const path = require('path');
const tsx = require('tsx/cjs/api');

const { sortI18n } = tsx.require(path.resolve(__dirname, './sortI18n.ts'), __filename);

sortI18n();
