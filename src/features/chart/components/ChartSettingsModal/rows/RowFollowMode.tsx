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

/** The five follow options: Off, and the two follow modes doubled into
 * animated / not-animated. The option key encodes the pair
 * (followMode, animateFollow) — both are per-chart ("custom"), like the
 * ratio. */
const FOLLOW_OPTIONS = [
	{ key: 'none', followMode: 'none' as const, animate: false },
	{ key: 'map', followMode: 'map' as const, animate: false },
	{ key: 'mapAnimated', followMode: 'map' as const, animate: true },
	{ key: 'center', followMode: 'center' as const, animate: false },
	{ key: 'centerAnimated', followMode: 'center' as const, animate: true },
];

/**
 * The follow mode is always per-chart ("custom"), like the ratio.
 */
const RowFollowMode: FC = () => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();
	const { chartKey, settings } = useContext(ChartSettingsModalContext);

	const animatedPrefix = t('chart.followAnimatedPrefix');

	const options = useMemo<OptionBase[]>(
		() =>
			FOLLOW_OPTIONS.map((opt) => {
				const base =
					opt.followMode === 'none'
						? t('chart.followModeNone')
						: opt.followMode === 'map'
							? t('chart.followModeMap')
							: t('chart.followModeCenter');
				return {
					key: opt.key,
					label: opt.animate ? `${animatedPrefix} ${base}` : base,
				};
			}),
		[t, animatedPrefix]
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
			const opt = FOLLOW_OPTIONS.find((o) => o.key === v);
			if (!opt) {
				return;
			}
			dispatch(
				setChartSettings({
					key: chartKey,
					settings: { followMode: opt.followMode as ChartFollowMode, animateFollow: opt.animate },
				})
			);
		},
		[
			dispatch,
			chartKey,
		]
	);

	const activeKey = useMemo(() => {
		const active = FOLLOW_OPTIONS.find(
			(o) => o.followMode === settings.followMode && o.animate === settings.animateFollow
		);
		return active?.key ?? 'none';
	}, [settings.followMode, settings.animateFollow]);

	const anchorLabel = useMemo(
		() => options.find((o) => o.key === activeKey)?.label ?? '',
		[options, activeKey]
	);

	return (
		<InfoLabelRow
			label={t('chart.followMode')}
			Info={hint}
		>
			<ButtonHighlightMenuControl
				options={options}
				value={activeKey}
				setValue={handleSetValue}
				anchorLabel={anchorLabel}
				compact
				buttonPropsProps={buttonPropsProps}
			/>
		</InfoLabelRow>
	);
};

export default RowFollowMode;
