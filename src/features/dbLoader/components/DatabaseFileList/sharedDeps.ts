/**
 * External dependencies
 */
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 8 * 3,
		paddingTop: 8,
		gap: 8 * 4,
	},
	notice: {
		marginVertical: 8 * 3,
		flexDirection: 'row',
		alignItems: 'center',
		padding: 8,
		gap: 8,
		borderWidth: 1,
	},
	noticeText: {
		flexShrink: 1,
		flexGrow: 1,
	},
	dirHeading: {
		marginBottom: 8,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 8,
		paddingRight: 8,
	},
	flexShrink1: { flexShrink: 1 },
	dirContent: {
		paddingLeft: 8 * 3,
		gap: 8,
	},
	fileRow: {
		flexDirection: 'row',
		alignItems: 'center',
		borderColor: 'transparent',
		borderStyle: 'solid',
		borderWidth: 0,
		borderLeftWidth: 8,
		paddingLeft: 8,
		marginLeft: -8,
	},
	fileInfo: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 8,
		marginRight: 8,
	},
	createNewRow: {
		paddingLeft: 8,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		minHeight: 48,
	},
	createNewExpanded: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 8,
	},
	createNewInput: {
		flex: 1,
	},
	createNewActions: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	modalContent: {
		gap: 16,
	},
});
