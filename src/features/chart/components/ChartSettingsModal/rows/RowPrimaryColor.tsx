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

const primaryColorOptions: OptionBase[] = [
	{ key: 'axis', label: 'chart.colorAxisPrimary' },
	{ key: 'elevation', label: 'chart.colorElevation' },
	{ key: 'elevationFill', label: 'chart.colorElevationFill' },
	{ key: 'slope', label: 'chart.colorSlope' },
	{ key: 'slopeFill', label: 'chart.colorSlopeFill' },
];

const RowPrimaryColor: FC = () => {
	const { t } = useTranslation();
	const { settings, update } = useContext(ChartSettingsModalContext);

	const selectedOpt = useMemo(
		() => primaryColorOptions.find((opt) => opt.key === settings.primaryColor),
		[settings.primaryColor]
	);

	if (settings.primary === 'none') {
		return null;
	}

	return (
		<InfoLabelRow label={t('chart.primaryColor')}>
			<ButtonHighlightMenuControl
				options={primaryColorOptions}
				value={settings.primaryColor}
				setValue={(v) => update({ primaryColor: v as ChartColorMode })}
				anchorLabel={t(selectedOpt?.label ?? '')}
				compact
				buttonPropsProps={{ paddingHorizontal: true }}
			/>
		</InfoLabelRow>
	);
};

export default RowPrimaryColor;
