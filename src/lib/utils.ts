/**
 * External dependencies
 */
import { Location } from 'react-native-mapsforge-vtm';
import { InteractionManager } from 'react-native';

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
