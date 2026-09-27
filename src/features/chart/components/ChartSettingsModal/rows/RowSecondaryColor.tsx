/**
 * External dependencies
 */
import React, { FC, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import InfoLabelRow from '../../../../../components/generic/infoWrapper/InfoLabelRow';
import ButtonHighlightMenuControl from '../../../../../components/generic/wrapper/ButtonHighlightMenuControl';
import { OptionBase } from '../../../../../types';
import { ChartColorMode } from '../../../types';
import { ChartSettingsModalContext } from '../Context';

const secondaryColorOptions: OptionBase[] = [
	{ key: 'axis', label: 'chart.colorAxisSecondary' },
	{ key: 'elevation', label: 'chart.colorElevation' },
	{ key: 'elevationFill', label: 'chart.colorElevationFill' },
	{ key: 'slope', label: 'chart.colorSlope' },
	{ key: 'slopeFill', label: 'chart.colorSlopeFill' },
];

const RowSecondaryColor: FC = () => {
	const { t } = useTranslation();
	const { settings, update } = useContext(ChartSettingsModalContext);

	const selectedOpt = useMemo(
		() => secondaryColorOptions.find((opt) => opt.key === settings.secondaryColor),
		[settings.secondaryColor]
	);

	if (settings.secondary === 'none') {
		return null;
	}

	return (
		<InfoLabelRow label={t('chart.secondaryColor')}>
			<ButtonHighlightMenuControl
				options={secondaryColorOptions}
				value={settings.secondaryColor}
				setValue={(v) => update({ secondaryColor: v as ChartColorMode })}
				anchorLabel={t(selectedOpt?.label ?? '')}
				compact
				buttonPropsProps={{ paddingHorizontal: true }}
			/>
		</InfoLabelRow>
	);
};

export default RowSecondaryColor;
