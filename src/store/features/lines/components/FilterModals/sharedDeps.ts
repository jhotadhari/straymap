/**
 * Internal dependencies
 */
import { StyleSheet } from 'react-native';

export const sharedStyles = StyleSheet.create({
	modalInner: {
		gap: 16,
		marginTop: 16,
	},
});

export type FilterColumnType = 'numeric' | 'date' | 'string' | 'tags';

export const getUnitPrefKey = (columnKey: string): string | undefined => {
	if (columnKey === 'length') {
		return 'distance';
	}
	if (
		columnKey === 'uphill' ||
		columnKey === 'downhill' ||
		columnKey === 'minZ' ||
		columnKey === 'maxZ'
	) {
		return 'heightDepth';
	}
	return undefined;
};
