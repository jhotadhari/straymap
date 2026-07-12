/**
 * Internal dependencies
 */
import { StyleSheet } from 'react-native';

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
		columnGap: 8,
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
