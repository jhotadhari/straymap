/**
 * External dependencies
 */
import { StyleSheet, ViewStyle } from 'react-native';

export const sharedStyles = StyleSheet.create({
	cell: {
		flexDirection: 'row',
		width: 100,
		borderWidth: 1,
		alignItems: 'center',
		justifyContent: 'center',
		flexWrap: 'nowrap',
	},
	flexRow: {
		flexDirection: 'row',
	},
	flexRowGap: {
		alignItems: 'center',
		flexDirection: 'row',
		gap: 8,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		minHeight: 8 * 8,
		paddingHorizontal: 8,
		paddingVertical: 8,
		gap: 8,
		borderBottomWidth: 1,
	},
	footer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 8,
		paddingVertical: 4,
		gap: 8,
		borderTopWidth: 1,
	},
	container: {
		flex: 1,
		justifyContent: 'space-between',
	},
	modalInner: {
		gap: 16,

		marginTop: 16,
	},
});

export type CellConfig = {
	style?: ViewStyle;
};

export const lineCells: { [key: string]: CellConfig } = {
	timestamp: { style: { width: 170 } },
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

export type FilterColumnType = 'numeric' | 'date' | 'string';

export const getFilterColumnType = (key: string): FilterColumnType | undefined => {
	if (key in lineCells) {
		if (key === 'timestamp') {
			return 'date';
		}
		if (key === 'title') {
			return 'string';
		}
	}
	if (key in statsCells) {
		return 'numeric';
	}
	return undefined;
};

export const cellConfigs: { [key: string]: CellConfig } = {
	...lineCells,
	...statsCells,
	...otherCells,
};
