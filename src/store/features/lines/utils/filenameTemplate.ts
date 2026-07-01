/**
 * Filename template resolver for line exports.
 *
 * Syntax: {{field}} or {{field|transform}}
 *
 * Supported transforms (lodash string functions):
 *   camelCase, capitalize, deburr, kebabCase, lowerCase, lowerFirst,
 *   snakeCase, startCase, toLower, toUpper, trim, upperCase, upperFirst
 *
 * Example:
 *   {{title|kebabCase}}_{{timestamp}}  →  morning-ride_2026-07-02.gpx
 */

import {
	camelCase,
	capitalize,
	deburr,
	kebabCase,
	lowerCase,
	lowerFirst,
	snakeCase,
	startCase,
	toLower,
	toUpper,
	trim,
	upperCase,
	upperFirst,
} from 'lodash-es';

type TransformFn = (value: string) => string;

const TRANSFORMS: Record<string, TransformFn> = {
	camelCase,
	capitalize,
	deburr,
	kebabCase,
	lowerCase,
	lowerFirst,
	snakeCase,
	startCase,
	toLower,
	toUpper,
	trim,
	upperCase,
	upperFirst,
};

/** Default template: title + date (caller formats timestamp before passing). */
export const DEFAULT_TEMPLATE = '{{title}}_{{timestamp}}';

/** Matches {{field}} or {{field|transform}} */
const TOKEN_RE = /\{\{(\w+)(?:\|(\w+))?\}\}/g;

/**
 * Resolves a filename template against a data record.
 *
 * Tokens that reference missing or null fields are left unresolved so
 * the caller can detect them (a filename containing `{{...}}` is a
 * sign something went wrong).
 */
export const resolveFilename = (
	template: string,
	data: Record<string, string | number | undefined | null>
): string => {
	return template.replace(
		TOKEN_RE,
		(match: string, field: string, transform: string) => {
			const raw = data[field];
			if (raw === undefined || raw === null) {
				return match;
			}
			let value = String(raw);
			if (transform) {
				const fn = TRANSFORMS[transform];
				if (fn) {
					value = fn(value);
				}
				// Unknown transforms are silently ignored — the raw
				// value is used instead so the export still succeeds.
			}
			return value;
		}
	);
};

/**
 * Sanitizes a resolved filename for safe use in a file path.
 * Strips path separators, leading dots, and control characters.
 */
// eslint-disable-next-line no-control-regex
const CTRL_RE = /[\x00-\x1f]/g;

export const sanitizeFilename = (name: string): string =>
	name.replace(/[/\\]/g, '_').replace(/^\.+/, '').replace(CTRL_RE, '');
