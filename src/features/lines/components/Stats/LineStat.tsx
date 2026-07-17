/**
 * External dependencies
 */
import { FC, useMemo } from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { Text, Icon, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../../store/hooks';
import { selectUnitPrefs } from '../../../general/selectors';
import { formatDistance, formatHeightDepth } from '../../../../lib/formatting';
import IconFontGis from '../../../../components/generic/primitives/IconFontGis';
import { RenderPart, defaultRenderParts, ICON_SIZE } from './sharedDeps';

const StatIcon: FC<{
	columnKey: string;
	renderParts: RenderPart[];
	iconColor: string;
}> = ({ columnKey, renderParts, iconColor }) => {
	if (!renderParts.includes('icon')) return null;
	switch (columnKey) {
		case 'length':
			return (
				<IconFontGis
					name="route-end"
					size={ICON_SIZE}
					color={iconColor}
				/>
			);
		case 'uphill':
			return (
				<Icon
					source="elevation-rise"
					size={ICON_SIZE}
				/>
			);
		case 'downhill':
			return (
				<Icon
					source="elevation-decline"
					size={ICON_SIZE}
				/>
			);
		case 'minZ':
			return (
				<Icon
					source="arrow-collapse-down"
					size={ICON_SIZE}
				/>
			);
		case 'maxZ':
			return (
				<Icon
					source="arrow-collapse-up"
					size={ICON_SIZE}
				/>
			);
		default:
			return null;
	}
};

const LineStat: FC<{
	columnKey: string;
	value: number;
	round?: number;
	style?: ViewProps['style'];
	renderParts?: RenderPart[];
}> = ({ columnKey, value, round, style, renderParts = defaultRenderParts }) => {
	const theme = useTheme();

	const { t } = useTranslation();

	const unitPrefs = useAppSelector(selectUnitPrefs);

	const formatted = useMemo(() => {
		switch (columnKey) {
			case 'length':
				return formatDistance(value, {
					...unitPrefs['distance']!,
					...(undefined !== round && { round }),
				});
			case 'uphill':
			case 'downhill':
			case 'minZ':
			case 'maxZ':
				return formatHeightDepth(value, {
					...unitPrefs['heightDepth']!,
					...(undefined !== round && { round }),
				});
		}
	}, [
		unitPrefs,
		value,
		columnKey,
		round,
	]);

	const dynamicStyle = useMemo(
		() => [
			styles.stat,
			style,
		],
		[style]
	);

	return (
		formatted &&
		formatted.length > 0 && (
			<View style={dynamicStyle}>
				{renderParts.map((renderPart) => {
					switch (renderPart) {
						case 'label':
							return <Text key={renderPart}>{t(`lines.columns.${columnKey}`)}</Text>;
						case 'icon':
							return (
								<View
									key={renderPart}
									style={styles.icon}
								>
									<StatIcon
										columnKey={columnKey}
										renderParts={renderParts}
										iconColor={theme.colors.onBackground}
									/>
								</View>
							);
						case 'value':
							return <Text key={renderPart}>{formatted}</Text>;
						default:
							return undefined;
					}
				})}
			</View>
		)
	);
};

const styles = StyleSheet.create({
	stat: {
		flexDirection: 'row',
		alignItems: 'center',
		flexWrap: 'nowrap',
	},
	icon: {
		minWidth: ICON_SIZE + 4,
		textAlign: 'center',
	},
});

export default LineStat;
