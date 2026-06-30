/**
 * External dependencies
 */
import { LineString } from 'geojson';

declare function requestIdleCallback(
	callback: (deadline: { didTimeout: boolean; timeRemaining: () => number }) => void,
	options?: { timeout?: number }
): number;
declare function cancelIdleCallback(handle: number): void;

/**
 * Internal dependencies
 */
import { LineStats as LineStatsType } from '../store/features/lines/types';
import { dbOpExecute } from '../store/features/dbLoader/utils';
import { NumType } from '../types';

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
