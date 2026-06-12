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

// ??? todo
export const formatDistance = (value: number, unitPref: UnitPref): string => {
	let string = '';
	switch (unitPref.unit) {
		case 'metric':
			string = roundTo(value / 1000, unitPref.round) + ' km';
			break;
	}

	return string;
};
// ??? todo
export const formatHeightDepth = (value: number, unitPref: UnitPref): string => {
	let string = '';
	switch (unitPref.unit) {
		case 'm':
			string = roundTo(value, unitPref.round) + ' m';
			break;
	}

	return string;
};
