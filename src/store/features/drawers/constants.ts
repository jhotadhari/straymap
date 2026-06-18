import { StyleSheet } from 'react-native';

export const handleSize = 50;
export const iconSize = 25;

export const itemStyles = StyleSheet.create({
	item: {
		gap: (handleSize - iconSize) / 4,
		top: -(handleSize - iconSize) / 3,
	},
	buttonRow: {
		marginVertical: (handleSize - iconSize) / 2,
		marginHorizontal: 16,
		gap: 8,
	},
	itemRow: {
		marginBottom: (handleSize - iconSize) / 4,
	},
});
