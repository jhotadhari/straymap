/**
 * External dependencies
 */
import React, { FC, useContext, useMemo } from 'react';
import { SegmentedButtons, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { ChartSettingsMode, ChartSettingsModalContext } from '../Context';

const RowChartMode: FC = () => {
	const { t } = useTranslation();
	const theme = useTheme();

	const { mode, setMode } = useContext(ChartSettingsModalContext);

	const segmentedButtonsTheme = useMemo(
		() => ({
			colors: {
				secondaryContainer: theme.colors.primaryContainer,
				textColor: theme.colors.onPrimaryContainer,
			},
		}),
		[theme.colors.primaryContainer, theme.colors.onPrimaryContainer]
	);

	const segmentButtons = useMemo(
		() => [
			{
				value: 'general',
				label: t('chart.chartModeDefault'),
			},
			{
				value: 'own',
				label: t('chart.chartModeCustom'),
			},
		],
		[t]
	);

	const hint = useMemo(
		() => (mode === 'own' ? t('chart.chartModeHintCustom') : t('chart.chartModeHintDefault')),
		[
			mode,
			t,
		]
	);

	return (
		<>
			<SegmentedButtons
				value={mode}
				onValueChange={(v) => setMode(v as ChartSettingsMode)}
				theme={segmentedButtonsTheme}
				buttons={segmentButtons}
			/>
			<Text
				variant="bodySmall"
				style={{ color: theme.colors.onSurfaceVariant }}
			>
				{hint}
			</Text>
		</>
	);
};

export default RowChartMode;
