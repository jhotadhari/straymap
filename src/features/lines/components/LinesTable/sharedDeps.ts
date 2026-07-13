/**
 * External dependencies
 */
import { ViewStyle } from 'react-native';

export type CellConfig = {
	style?: ViewStyle;
};

export const lineCells: { [key: string]: CellConfig } = {
	created_at: { style: { width: 170 } },
	modified_at: { style: { width: 170 } },
	custom_date: { style: { width: 170 } },
	title: { style: { width: 200 } },
};

export const statsCells: { [key: string]: CellConfig } = {
	length: { style: { width: 90 } },
	uphill: { style: { width: 90 } },
	downhill: { style: { width: 90 } },
	minZ: { style: { width: 110 } },
	maxZ: { style: { width: 110 } },
};

export const otherCells: { [key: string]: CellConfig } = {
	tags: { style: { width: 200 } },
};

export type CellCategory = 'line' | 'stats' | 'other';

export const getCellCategory = (key: string): CellCategory | undefined => {
	if (key in lineCells) {
		return 'line';
	}
	if (key in statsCells) {
		return 'stats';
	}
	if (key in otherCells) {
		return 'other';
	}
	return undefined;
};

export type FilterColumnType = 'numeric' | 'date' | 'string' | 'tags';

export const getFilterColumnType = (key: string): FilterColumnType | undefined => {
	if (key in lineCells) {
		if (key === 'created_at' || key === 'modified_at' || key === 'custom_date') {
			return 'date';
		}
		if (key === 'title') {
			return 'string';
		}
	}
	if (key in statsCells) {
		return 'numeric';
	}
	if (key in otherCells) {
		if (key === 'tags') {
			return 'tags';
		}
	}
	return undefined;
};

export const cellConfigs: { [key: string]: CellConfig } = {
	...lineCells,
	...statsCells,
	...otherCells,
};
