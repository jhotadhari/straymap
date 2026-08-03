import { StyleSheet } from 'react-native';

export const localStyles = StyleSheet.create({
	modalInner: {
		gap: 16,
		marginTop: 16,
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
	filename: {
		fontWeight: 'bold',
		marginBottom: 4,
	},
	featureCount: {
		opacity: 0.7,
		marginBottom: 8,
	},
	selectRow: {
		flexDirection: 'row',
		gap: 8,
		marginHorizontal: 16,
		marginBottom: 4,
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
		marginTop: 0,
		marginBottom: 4,
		marginHorizontal: 16,
	},
	bottomSpacer: {
		height: 32,
	},
});
