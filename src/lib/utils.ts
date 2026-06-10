/**
 * External dependencies
 */
import { Location } from 'react-native-mapsforge-vtm';
import { InteractionManager } from 'react-native';
import { LineString } from 'geojson';

/**
 * Internal dependencies
 */
import { LineStats as LineStatsType } from '../store/features/lines/types';
import { dbOpExecute } from '../db/utils';

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

export const locationsToCoordsArr = (positions: Location[]) => {
	return positions.map((pos) => [
		pos.lng,
		pos.lat,
		...(undefined === pos?.alt ? [] : [pos?.alt]),
	]);
};

export const lineStringToStats = async (
	lineStr: LineString
): Promise<LineStatsType | undefined> => {
	const lineStringEpsgStr = JSON.stringify({
		...lineStr,
		crs: {
			type: 'name',
			properties: { name: 'EPSG:4326' },
		},
	});

	const res = await dbOpExecute(
		`
        select
            GreatCircleLength ("geometry") as length,
            UphillHeight ("geometry") as uphill,
            DownhillHeight ("geometry") as downhill
        from (
            SELECT GeomFromGeoJSON( ? ) as geometry
        )
        `,
		[
			lineStringEpsgStr,
		]
	);
	return res?.rows?.length ? (res.rows[0] as LineStatsType) : undefined;
};
