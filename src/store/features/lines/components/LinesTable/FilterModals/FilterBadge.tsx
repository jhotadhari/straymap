/**
 * External dependencies
 */
import { FC, useMemo } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../../../hooks';
import { selectUnitPrefs } from '../../../../general/selectors';
import { formatDistance, formatHeightDepth } from '../../../../../../lib/formatting';
import { getUnitPrefKey } from '../sharedDeps';
import { ColumnFilter } from '../../../types';

const formatFilterSummary = (
	filter: ColumnFilter,
	t: (key: string) => string,
	unitPrefs?: ReturnType<typeof selectUnitPrefs>
): string => {
	const columnLabel = t(`lines.columns.${filter.columnKey}`);
	switch (filter.type) {
		case 'numeric': {
			const unitPrefKey = getUnitPrefKey(filter.columnKey);
			const unitPref = unitPrefKey ? unitPrefs?.[unitPrefKey] : undefined;
			const parts: string[] = [];
			if (filter.min !== undefined) {
				const formatted =
					unitPrefKey === 'distance' && unitPref
						? formatDistance(filter.min, unitPref)
						: unitPrefKey === 'heightDepth' && unitPref
							? formatHeightDepth(filter.min, unitPref)
							: filter.min.toString();
				parts.push(`≥ ${formatted}`);
			}
			if (filter.max !== undefined) {
				const formatted =
					unitPrefKey === 'distance' && unitPref
						? formatDistance(filter.max, unitPref)
						: unitPrefKey === 'heightDepth' && unitPref
							? formatHeightDepth(filter.max, unitPref)
							: filter.max.toString();
				parts.push(`≤ ${formatted}`);
			}
			return `${columnLabel} ${parts.join(', ')}`;
		}
		case 'date': {
			const parts: string[] = [];
			if (filter.min !== undefined) {
				parts.push(`≥ ${filter.min}`);
			}
			if (filter.max !== undefined) {
				parts.push(`≤ ${filter.max}`);
			}
			return `${columnLabel} ${parts.join(', ')}`;
		}
		case 'string': {
			const opLabel = t(
				`lines.filter${filter.operator.charAt(0).toUpperCase() + filter.operator.slice(1)}`
			);
			return `${columnLabel} ${opLabel} "${filter.value}"`;
		}
		case 'tags': {
			const opLabel = t(
				`lines.filter${filter.operator.charAt(0).toUpperCase() + filter.operator.slice(1)}`
			);
			return `${columnLabel} ${opLabel} "${filter.value}"`;
		}
	}
};

const FilterBadge: FC<{
	filter: ColumnFilter;
	onPress: () => void;
}> = ({ filter, onPress }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const unitPrefs = useAppSelector(selectUnitPrefs);

	const summary = useMemo(
		() => formatFilterSummary(filter, t, unitPrefs),
		[
			filter,
			t,
			unitPrefs,
		]
	);

	const style = useMemo(
		() => [
			styles.badge,
			{
				backgroundColor: theme.colors.secondaryContainer,
				borderColor: theme.colors.outline,
			},
		],
		[theme]
	);

	const textStyle = useMemo(
		() => [
			styles.badgeText,
			{
				color: theme.colors.onSecondaryContainer,
			},
		],
		[theme]
	);

	return (
		<TouchableOpacity
			style={style}
			onPress={onPress}
			activeOpacity={0.7}
		>
			<Text
				style={textStyle}
				numberOfLines={1}
			>
				{summary}
			</Text>
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	badge: {
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 12,
		borderWidth: 1,
		maxWidth: 200,
	},
	badgeText: {
		fontSize: 12,
	},
});

export default FilterBadge;
