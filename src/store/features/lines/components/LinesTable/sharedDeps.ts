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
	header: {
		flexDirection: 'row',
		justifyContent: 'flex-start',
		alignItems: 'center',
		minHeight: 8 * 8,
		paddingHorizontal: 8,
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
	minZ: { style: { width: 90 } },
	maxZ: { style: { width: 90 } },
};

export const otherCells: { [key: string]: CellConfig } = {
	tags: { style: { width: 200 } },
};
