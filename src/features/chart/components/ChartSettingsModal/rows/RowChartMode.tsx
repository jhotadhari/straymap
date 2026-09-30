/**
 * External dependencies
 */
import React, { FC, useCallback, useContext, useMemo } from 'react';
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

	const handleValueChange = useCallback(
		(v: string) => setMode(v as ChartSettingsMode),
		[setMode]
	);

	const styleHint = useMemo(
		() => ({ color: theme.colors.onSurfaceVariant }),
		[theme]
	);

	return (
		<>
			<SegmentedButtons
				value={mode}
				onValueChange={handleValueChange}
				theme={segmentedButtonsTheme}
				buttons={segmentButtons}
			/>
			<Text
				variant="bodySmall"
				style={styleHint}
			>
				{hint}
			</Text>
		</>
	);
};

export default RowChartMode;
