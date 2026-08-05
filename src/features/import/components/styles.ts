import { StyleSheet } from 'react-native';

export const localStyles = StyleSheet.create({
	container: {
		gap: 16,
		marginTop: 16,
		marginHorizontal: 16,
	},
	idleContainer: {
		gap: 32,
		alignItems: 'center',
		paddingVertical: 16,
	},
	hint: {
		textAlign: 'center',
		opacity: 0.7,
	},
	centered: {
		alignItems: 'center',
		gap: 12,
		paddingVertical: 24,
	},
	selectRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginVertical: 16,
	},
	featureListItem: {
		padding: 0,	// overwrite ListItem innerStyle
		marginLeft: 0, // // overwrite ListItem innerStyle
		paddingVertical: 4,
	},
	tagSelectList: {
		marginHorizontal: 16,
	},
	importControls: {
		marginTop: 16,
		marginBottom: 16,
		marginHorizontal: 16,
	},
	resultSummary: {
		fontWeight: 'bold',
		marginBottom: 8,
		marginHorizontal: 16,
	},
	resultDetail: {
		opacity: 0.8,
		fontSize: 12,
	},
	configInput: {
		maxWidth: 220,
	},
	configPreview: {
		marginTop: 2,
	},
	autoWidth: {
		width: 'auto',
	},
	unmatchedRow: {
		marginTop: 4,
		marginLeft: 36,
	},
	unmatchedListItem: {
		padding: 0,
		marginLeft: 0,
		paddingVertical: 4,
	},
});
