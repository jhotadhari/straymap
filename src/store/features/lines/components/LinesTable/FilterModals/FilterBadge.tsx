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
import { ColumnFilter } from '../../../types';

const formatFilterSummary = (filter: ColumnFilter, t: (key: string) => string): string => {
	const columnLabel = t(`lines.columns.${filter.columnKey}`);
	switch (filter.type) {
		case 'numeric': {
			const parts: string[] = [];
			if (filter.min !== undefined) {
				parts.push(`≥ ${filter.min}`);
			}
			if (filter.max !== undefined) {
				parts.push(`≤ ${filter.max}`);
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
	}
};

const FilterBadge: FC<{
	filter: ColumnFilter;
	onPress: () => void;
}> = ({ filter, onPress }) => {
	const theme = useTheme();
	const { t } = useTranslation();

	const summary = useMemo(() => formatFilterSummary(filter, t), [filter, t]);

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
