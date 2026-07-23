/**
 * External dependencies
 */
import { LineString, Point, Polygon, Position } from 'geojson';
import { Bbox } from 'react-native-mapsforge-vtm';

declare function requestIdleCallback(
	callback: (deadline: { didTimeout: boolean; timeRemaining: () => number }) => void,
	options?: { timeout?: number }
): number;
declare function cancelIdleCallback(handle: number): void;

/**
 * Internal dependencies
 */
import { LineStats as LineStatsType } from '../features/lines/types';
import { dbOpExecute } from '../features/dbLoader/utils';
import { NumType } from '../types';
import { isEqual } from 'lodash-es';
import { roundTo } from './utilsLight';
import { lineString } from '@turf/turf';

export const logError = (context: string, err: unknown) => {
	console.error(`[${context}]`, err);
};

export const strValToNb = (val: string, numType: NumType = 'int'): number => {
	switch (numType) {
		case 'int':
			return parseInt(
				(val.trim().startsWith('-') ? '-' : '') + val.trim().replace(/[^0-9]/g, ''),
				10
			);
		case 'float':
			return parseFloat(
				(val.trim().startsWith('-') ? '-' : '') +
					val
						.trim()
						.replace(/,/g, '.')
						.replace(/[^0-9.]/g, '')
			);
	}
};

export const runAfterInteractions = (
	task: () => any,
	delayFallback?: number // runs the task after milliseconds, if requestIdleCallback didn't fire
) => {
	delayFallback = delayFallback ? delayFallback : 1000;
	let shouldRun = true;
	const taskWrapped = () => {
		if (shouldRun) {
			shouldRun = false;
			clearTimeout(timeout);
			cancelIdleCallback(handle);
			task();
		}
	};
	const timeout = setTimeout(taskWrapped, delayFallback);
	const handle = requestIdleCallback(taskWrapped);
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
            DownhillHeight ("geometry") as downhill,
            ST_MinZ ("geometry") as minZ,
            ST_MaxZ ("geometry") as maxZ
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

// Check if 2 coordinates are equal. Precision rounded to 4 so it will recognize the result of `pointToFakeLineStringFeature`.
export const pointsCoordsAreOverlapping = (coords1: Position, coords2: Position) => {
	return isEqual(
		[
			roundTo(coords1[0], 4),
			roundTo(coords1[1], 4),
		],
		[
			roundTo(coords2[0], 4),
			roundTo(coords2[1], 4),
		]
	);
};

// Create a fake lineString from one point. Just duplicate the point with a slightly different geometry.
// The the points will be recognized by `pointsCoordsAreOverlapping` as overlapping.
export const pointToFakeLineStringFeature = (point: Point) => {
	return lineString([
		point.coordinates,
		[
			point.coordinates[0] + 0.000001,
			point.coordinates[1] + 0.000001,
			point.coordinates[2],
		],
	]);
};

// Exponential-backoff delay for retry loops. Starts at 100 ms (attempt 0),
// grows to 500 ms and stays there so cache-miss tile loads get polled quickly
// without flooding the ElevationReader's preload executor on prolonged misses.
export const getRetryDelay = (attempt: number) =>
	Math.min(500, Math.max(100, 10 * Math.pow(2, attempt)));

export const envelopeToBBox = (envelope: Polygon): Bbox => {
	const ring = envelope.coordinates[0];
	const lngs = ring.map((c) => c[0]);
	const lats = ring.map((c) => c[1]);
	return [
		Math.min(...lngs),
		Math.min(...lats),
		Math.max(...lngs),
		Math.max(...lats),
	];
};
