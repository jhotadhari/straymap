/**
 * External dependencies
 */
import React, { FC, useCallback, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import InfoLabelRow from '../../../../../components/generic/infoWrapper/InfoLabelRow';
import ButtonHighlightMenuControl from '../../../../../components/generic/wrapper/ButtonHighlightMenuControl';
import { useAppDispatch } from '../../../../../store/hooks';
import { OptionBase } from '../../../../../types';
import { setChartSettings } from '../../../slice';
import { ChartFollowMode } from '../../../types';
import { ChartSettingsModalContext } from '../Context';

const buttonPropsProps = { paddingHorizontal: true };

/**
 * The follow mode is always per-chart ("custom"), like the ratio.
 */
const RowFollowMode: FC = () => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();
	const { chartKey, settings } = useContext(ChartSettingsModalContext);

	const options = useMemo<OptionBase[]>(
		() => [
			{ key: 'none', label: t('chart.followModeNone') },
			{ key: 'map', label: t('chart.followModeMap') },
			{ key: 'center', label: t('chart.followModeCenter') },
		],
		[t]
	);

	const hint = useMemo(() => {
		switch (settings.followMode) {
			case 'map':
				return t('chart.followModeHintMap');
			case 'center':
				return t('chart.followModeHintCenter');
			default:
				return t('chart.followModeHintNone');
		}
	}, [
		settings.followMode,
		t,
	]);

	const handleSetValue = useCallback(
		(v: string) => {
			dispatch(
				setChartSettings({ key: chartKey, settings: { followMode: v as ChartFollowMode } })
			);
		},
		[
			dispatch,
			chartKey,
		]
	);

	const anchorLabel = useMemo(
		() => options.find((o) => o.key === settings.followMode)?.label ?? '',
		[
			options,
			settings.followMode,
		]
	);

	return (
		<InfoLabelRow
			label={t('chart.followMode')}
			Info={hint}
		>
			<ButtonHighlightMenuControl
				options={options}
				value={settings.followMode}
				setValue={handleSetValue}
				anchorLabel={anchorLabel}
				compact
				buttonPropsProps={buttonPropsProps}
			/>
		</InfoLabelRow>
	);
};

export default RowFollowMode;
