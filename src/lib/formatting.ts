/**
 * External dependencies
 */
import formatcoords from 'formatcoords';

/**
 * Internal dependencies
 */
import { UnitPref } from '../store/features/general/types';
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

// Input: meters
export const formatDistance = (value: number, unitPref: UnitPref): string => {
	switch (unitPref.unit) {
		case 'imperial':
			return roundTo(value * M_TO_MI, unitPref.round) + ' mi';
		case 'nautical':
			return roundTo(value * M_TO_NM, unitPref.round) + ' nm';
		case 'metric':
		default:
			return roundTo(value / 1000, unitPref.round) + ' km';
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
