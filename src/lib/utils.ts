/**
 * External dependencies
 */
import { get } from 'lodash-es';
import slugify from 'slugify';
import { Location } from 'react-native-mapsforge-vtm';
import { InteractionManager } from 'react-native';

/**
 * Internal dependencies
 */
import { UnitPref } from '../store/features/general/types';
import { roundTo } from './utilsGeneral';

export const formatSeconds = (secNum: number): string => {
	secNum = Math.round(secNum);
	const hours: number = Math.floor(secNum / 3600);
	const minutes: number = Math.floor((secNum - hours * 3600) / 60);
	const seconds: number = secNum - hours * 3600 - minutes * 60;
	return [
		(hours < 10 ? '0' : '') + hours + 'h',
		(minutes < 10 ? '0' : '') + minutes + 'm',
		(seconds < 10 ? '0' : '') + seconds + 's',
	].join(' ');
};

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

export const stringifyProp = (prop: any, deli?: string): string => {
	deli = deli || '_';
	switch (true) {
		case 'string' === typeof prop:
			return slugify(prop + '', { strict: true, replacement: '_' });
		case 'number' === typeof prop:
			return [
				prop < 0 ? 'm' : '',
				slugify((prop + '').replace('.', 'd'), { strict: true, replacement: '_' }),
			].join('');
		case 'object' === typeof prop:
			return Object.keys(prop)
				.sort()
				.reduce((acc: string, optKey: string) => {
					return acc + deli + stringifyProp(get(prop, optKey));
				}, '');
		case 'boolean' === typeof prop:
			return true === prop ? '1' : '0';
		default:
			return '';
	}
};

export const runAfterInteractions = (
	task: () => any,
	delayFallback?: number // runs the task after milliseconds, if InteractionManager didn't start it.
) => {
	delayFallback = delayFallback ? delayFallback : 1000;
	let shouldRun = true;
	const taskWrapped = () => {
		if (shouldRun) {
			shouldRun = false;
			clearTimeout(timeout);
			task();
		}
	};
	const timeout = setTimeout(taskWrapped, delayFallback);
	InteractionManager.runAfterInteractions(taskWrapped);
};

// ??? todo
export const formatDistance = (distance: number, unitPref: UnitPref): string => {
	let string = '';
	switch (unitPref.unit) {
		case 'metric':
			string = roundTo(distance / 1000, 2) + ' km';
			break;
	}

	return string;
};

export const getUpDown = (
	locations?: Location[]
): {
	up: number;
	down: number;
} => {
	return locations
		? locations.reduce(
				(acc, coord, index) => {
					if (0 === index) {
						return acc;
					}
					const prevCoord = locations[index - 1];
					const altDiff =
						undefined !== coord?.alt && undefined !== prevCoord?.alt
							? coord?.alt - prevCoord.alt
							: 0;
					if (altDiff > 0) {
						acc.up = acc.up + altDiff;
					} else {
						acc.down = acc.down - altDiff;
					}
					return acc;
				},
				{
					up: 0,
					down: 0,
				}
			)
		: {
				up: 0,
				down: 0,
			};
};
