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
	},
	unmatchedListItem: {
		padding: 0,
		marginLeft: 0,
		paddingVertical: 4,
	},
	buttonBar: {
		flexDirection: 'row',
		gap: 8,
		marginHorizontal: 16,
		marginBottom: 12,
	},
	dryRunNoticeText: {
		flexShrink: 1,
		flexGrow: 1,
	},
	dryRunNotice: {
		marginHorizontal: 16,

		marginVertical: 8 * 3,
		flexDirection: 'row',
		alignItems: 'center',
		padding: 8,
		gap: 8,
		borderWidth: 1,
	},
	fileRow: {
		paddingHorizontal: 16,
		paddingVertical: 10,
		gap: 2,
		borderBottomWidth: StyleSheet.hairlineWidth,
	},
	fileRowHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		marginBottom: 2,
	},
	fileName: {
		fontWeight: 'bold',
		// fontSize: 14,
	},
	fileRowCounts: {
		// fontSize: 13,
		marginBottom: 2,
	},
	fileRowDetail: {
		// fontSize: 12,
		opacity: 0.7,
		marginBottom: 1,
	},
	fileRowBadges: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 4,
		marginTop: 4,
	},
	mergedBadge: {
		alignSelf: 'flex-start',
		marginBottom: 2,
	},
	resultButtonSpacer: {
		height: 16,
	},
	flex1: {
		flex: 1,
	},
});
