/**
 * Internal dependencies
 */

export type CellConfig = {
	style?: { width?: number };
};

export const tagCells: { [key: string]: CellConfig } = {
	label: { style: { width: 180 } },
	line_count: { style: { width: 80 } },
	color: { style: { width: 100 } },
	created_at: { style: { width: 170 } },
	notes: { style: { width: 200 } },
};

export type CellCategory = 'tag' | 'other';

export const getCellCategory = (key: string): CellCategory | undefined => {
	if (key in tagCells) {
		return 'tag';
	}
	return undefined;
};

export type FilterColumnType = 'numeric' | 'date' | 'string';

export const getFilterColumnType = (key: string): FilterColumnType | undefined => {
	if (key === 'label') {
		return 'string';
	}
	if (key === 'line_count') {
		return 'numeric';
	}
	if (key === 'created_at') {
		return 'date';
	}
	return undefined;
};

export const cellConfigs: { [key: string]: CellConfig } = {
	...tagCells,
};
