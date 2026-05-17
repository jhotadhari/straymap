import { StyleSheet } from "react-native";

export const handleSize = 50;
export const iconSize = 25;

export const itemStyles = StyleSheet.create({
	nix: {
		// gap: 8
	},
	item: {
		gap: (handleSize - iconSize) / 4,
		top: -(handleSize - iconSize) / 3,

	},
	buttonRow: {
		marginVertical: (handleSize - iconSize) / 2,
		marginHorizontal: 20,

	},
	itemRow: {
		marginBottom: (handleSize - iconSize) / 4,
	},
});