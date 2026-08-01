import { StyleSheet } from 'react-native';

export const localStyles = StyleSheet.create({
	modalInner: {
		gap: 16,
		marginTop: 16,
	},
	idleContainer: {
		gap: 24,
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
		marginBottom: 8,
	},
	featureList: {
		maxHeight: 300,
		marginBottom: 8,
	},
	featureRow: {
		flexDirection: 'row',
		alignItems: 'center',
		borderBottomWidth: 1,
		paddingVertical: 4,
	},
	mergeToggle: {
		marginTop: 8,
	},
	dryRunToggle: {
		paddingVertical: 4,
	},
	importControls: {
		marginTop: 12,
	},
	resultSummary: {
		fontWeight: 'bold',
		marginBottom: 8,
	},
	resultRow: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: 8,
		borderBottomWidth: 1,
		paddingVertical: 8,
	},
	resultTextCol: {
		flex: 1,
		flexDirection: 'column',
		gap: 2,
	},
	resultFileName: {
		fontWeight: 'bold',
	},
	resultDetail: {
		opacity: 0.8,
		fontSize: 12,
	},
	configSection: {
		gap: 12,
		marginTop: 12,
	},
	configInput: {
		borderWidth: 1,
		paddingHorizontal: 8,
		paddingVertical: 4,
	},
	configPreview: {
		marginTop: 4,
	},
});
