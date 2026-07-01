/**
 * Internal dependencies
 */
import { MdPart } from './types';

let firstNonEmptyLine: null | number = null;
const filterCb = (line: string, idx: number) => {
	if (0 === idx) {
		firstNonEmptyLine = null;
	}
	if (null !== firstNonEmptyLine) {
		return true;
	}
	if (line.replace(/\s/, '').length) {
		firstNonEmptyLine = idx;
		return true;
	}
	return false;
};

export const removeLeadingTrailingEmptyLines = (str: string, skipLinesNb?: number): string => {
	skipLinesNb = undefined === skipLinesNb ? 0 : skipLinesNb;
	const lines = str.split('\n').slice(skipLinesNb);
	return lines.filter(filterCb).reverse().filter(filterCb).reverse().join('\n');
};

export const removeLines = (str: string, pattern: RegExp): string => {
	const lines = str.split('\n');
	return lines
		.filter((line: string) => {
			return !line.match(pattern);
		})
		.join('\n');
};

export const getMdParts = (fileContent: string): MdPart[] =>
	[...fileContent.split(/\n##\s[\s\S]*?/g)]
		.map((str: string): null | MdPart => {
			const key = str.match(/(.*?)\n/);
			return key
				? {
						key: key[1],
						str: removeLeadingTrailingEmptyLines(str, 1),
					}
				: null;
		})
		.filter((a) => null !== a) as MdPart[];
