/**
 * External dependencies
 */
import formatcoords from 'formatcoords';

/**
 * Internal dependencies
 */
import { UnitPref } from '../features/general/types';
import { roundTo } from './utilsLight';

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

// Conversion factors
const M_TO_FT = 3.28084;
const M_TO_FATHOM = 0.5468066492;
const MS_TO_KMH = 3.6;
const MS_TO_MPH = 2.23694;
const MS_TO_KNOTS = 1.94384;
const M_TO_MI = 0.000621371;
const M_TO_NM = 0.000539957;

export const formatDistanceUnit = (unitPref: UnitPref, useFraction?: boolean): string => {
	if (useFraction) {
		switch (unitPref.unit) {
			case 'imperial':
				return 'ft';
			case 'nautical':
				return 'nm';
			case 'metric':
			default:
				return 'm';
		}
	}
	switch (unitPref.unit) {
		case 'imperial':
			return 'mi';
		case 'nautical':
			return 'nm';
		case 'metric':
		default:
			return 'km';
	}
};

// Input: meters
export const formatDistance = (
	value: number,
	unitPref: UnitPref,
	useFraction?: boolean
): string => {
	const unitStr = formatDistanceUnit( unitPref, useFraction );
	if (useFraction) {
		switch (unitPref.unit) {
			case 'imperial':
				return roundTo(value * M_TO_FT, unitPref.round) + ' ' + unitStr;
			// nautical stays at nm (not fractioned)
			case 'nautical':
				return roundTo(value * M_TO_NM, unitPref.round) + ' ' + unitStr;
			case 'metric':
			default:
				return roundTo(value, unitPref.round) + ' ' + unitStr;
		}
	}
	switch (unitPref.unit) {
		case 'imperial':
			return roundTo(value * M_TO_MI, unitPref.round) + ' ' + unitStr;
		case 'nautical':
			return roundTo(value * M_TO_NM, unitPref.round) + ' ' + unitStr;
		case 'metric':
		default:
			return roundTo(value / 1000, unitPref.round) + ' ' + unitStr;
	}
};

// Input: meters
export const formatHeightDepth = (value: number, unitPref: UnitPref): string => {
	switch (unitPref.unit) {
		case 'ft':
			return roundTo(value * M_TO_FT, unitPref.round) + ' ft';
		case 'fath':
			return roundTo(value * M_TO_FATHOM, unitPref.round) + ' fathom';
		case 'm':
		default:
			return roundTo(value, unitPref.round) + ' m';
	}
};

// Input: m/s
export const formatSpeed = (value: number, unitPref: UnitPref): string => {
	switch (unitPref.unit) {
		case 'kmh':
			return roundTo(value * MS_TO_KMH, unitPref.round) + ' km/h';
		case 'mph':
			return roundTo(value * MS_TO_MPH, unitPref.round) + ' mph';
		case 'knots':
			return roundTo(value * MS_TO_KNOTS, unitPref.round) + ' kn';
		case 'bft': {
			// Beaufort scale based on wind speed at 10m height
			const BEAUFORT_THRESHOLDS = [
				0.3,
				1.6,
				3.4,
				5.5,
				8.0,
				10.8,
				13.9,
				17.2,
				20.8,
				24.5,
				28.5,
				32.7,
			];
			const bft = BEAUFORT_THRESHOLDS.findIndex((t) => value < t);
			return (bft === -1 ? 12 : bft) + ' bft';
		}
		case 'ms':
			return roundTo(value, unitPref.round) + ' m/s';
		case 'fs':
			return roundTo(value * M_TO_FT, unitPref.round) + ' ft/s';
		default:
			return roundTo(value * MS_TO_KMH, unitPref.round) + ' km/h';
	}
};

const COORDS_FORMAT_MAP: Record<string, string> = {
	// https://www.npmjs.com/package/formatcoords#user-content-formatting
	dd: 'f',
	dmm: 'Ff',
	dms: 'FFf',
};

export const formatCoords = (lat: number, lng: number, unitPref: UnitPref): string => {
	return formatcoords(lat, lng).format(COORDS_FORMAT_MAP[unitPref.unit] ?? 'f', {
		decimalPlaces: Math.min(unitPref.round ?? 4, 99),
	});
};

/**
 * Haversine distance between two [lng, lat] points, returns meters.
 */
export const haversineDistance = (a: [number, number], b: [number, number]): number => {
	const R = 6371000; // Earth radius in meters
	const toRad = (deg: number) => (deg * Math.PI) / 180;
	const dLat = toRad(b[1] - a[1]);
	const dLng = toRad(b[0] - a[0]);
	const sinDLat = Math.sin(dLat / 2);
	const sinDLng = Math.sin(dLng / 2);
	const aVal =
		sinDLat * sinDLat + Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * sinDLng * sinDLng;
	return R * 2 * Math.atan2(Math.sqrt(Math.max(0, aVal)), Math.sqrt(Math.max(0, 1 - aVal)));
};

/**
 * Total Haversine length of a line geometry, returns meters.
 */
export const haversineLineLength = (coords: number[][]): number => {
	let total = 0;
	for (let i = 1; i < coords.length; i++) {
		total += haversineDistance(
			[coords[i - 1][0], coords[i - 1][1]],
			[coords[i][0], coords[i][1]]
		);
	}
	return total;
};

// ── Inverse converters: display unit → metric ─────────────────────────

// Input: user-entered value in the preferred unit, output: meters
export const parseDistance = (value: number, unitPref: UnitPref): number => {
	switch (unitPref.unit) {
		case 'imperial':
			return value / M_TO_MI;
		case 'nautical':
			return value / M_TO_NM;
		case 'metric':
		default:
			return value * 1000;
	}
};

// Input: user-entered value in the preferred unit, output: meters
export const parseHeightDepth = (value: number, unitPref: UnitPref): number => {
	switch (unitPref.unit) {
		case 'ft':
			return value / M_TO_FT;
		case 'fath':
			return value / M_TO_FATHOM;
		case 'm':
		default:
			return value;
	}
};

// ── Display-only converters: meters → display unit (number, no suffix) ──

// Input: meters, output: value in the preferred unit (no suffix)
export const toDisplayDistance = (meters: number, unitPref: UnitPref): number => {
	switch (unitPref.unit) {
		case 'imperial':
			return meters * M_TO_MI;
		case 'nautical':
			return meters * M_TO_NM;
		case 'metric':
		default:
			return meters / 1000;
	}
};

// Input: meters, output: value in the preferred unit (no suffix)
export const toDisplayHeightDepth = (meters: number, unitPref: UnitPref): number => {
	switch (unitPref.unit) {
		case 'ft':
			return meters * M_TO_FT;
		case 'fath':
			return meters * M_TO_FATHOM;
		case 'm':
		default:
			return meters;
	}
};

// ── Unit suffix helpers ────────────────────────────────────────────────

export const getDistanceUnitSuffix = (unitPref: UnitPref): string => {
	switch (unitPref.unit) {
		case 'imperial':
			return 'mi';
		case 'nautical':
			return 'nm';
		case 'metric':
		default:
			return 'km';
	}
};

export const getHeightDepthUnitSuffix = (unitPref: UnitPref): string => {
	switch (unitPref.unit) {
		case 'ft':
			return 'ft';
		case 'fath':
			return 'fathom';
		case 'm':
		default:
			return 'm';
	}
};

/**
 * Format a duration in seconds as H:MM:SS or M:SS.
 */
export const formatDurationCompact = (sec: number): string => {
	const h = Math.floor(sec / 3600);
	const m = Math.floor((sec % 3600) / 60);
	const s = sec % 60;
	if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
	return `${m}:${s.toString().padStart(2, '0')}`;
};
