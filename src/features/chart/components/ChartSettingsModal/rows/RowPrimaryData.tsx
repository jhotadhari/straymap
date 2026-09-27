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
import { ChartSeriesValue } from '../../../types';
import { ChartSettingsModalContext } from '../Context';

const primaryDataOptions: OptionBase[] = [
	{ key: 'none', label: 'chart.seriesNone' },
	{ key: 'elevation', label: 'chart.seriesElevation' },
	{ key: 'slope', label: 'chart.seriesSlope' },
];

const RowPrimaryData: FC = () => {
	const { t } = useTranslation();
	const { settings, update } = useContext(ChartSettingsModalContext);

	const selectedOpt = useMemo(
		() => primaryDataOptions.find((opt) => opt.key === settings.primary),
		[settings.primary]
	);

	return (
		<InfoLabelRow label={t('chart.primaryData')}>
			<ButtonHighlightMenuControl
				options={primaryDataOptions}
				value={settings.primary}
				setValue={(v) => update({ primary: v as ChartSeriesValue })}
				anchorLabel={t(selectedOpt?.label ?? '')}
				compact
				buttonPropsProps={{ paddingHorizontal: true }}
			/>
		</InfoLabelRow>
	);
};

export default RowPrimaryData;
