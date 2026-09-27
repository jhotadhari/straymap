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

const secondaryDataOptions: OptionBase[] = [
	{ key: 'none', label: 'chart.seriesNone' },
	{ key: 'elevation', label: 'chart.seriesElevation' },
	{ key: 'slope', label: 'chart.seriesSlope' },
];

const RowSecondaryData: FC = () => {
	const { t } = useTranslation();
	const { settings, update } = useContext(ChartSettingsModalContext);

	const selectedOpt = useMemo(
		() => secondaryDataOptions.find((opt) => opt.key === settings.secondary),
		[settings.secondary]
	);

	return (
		<InfoLabelRow
			label={t('chart.secondaryData')}
			Info={t('chart.secondaryDataHint')}
		>
			<ButtonHighlightMenuControl
				options={secondaryDataOptions}
				value={settings.secondary}
				setValue={(v) => update({ secondary: v as ChartSeriesValue })}
				anchorLabel={t(selectedOpt?.label ?? '')}
				compact
				buttonPropsProps={{ paddingHorizontal: true }}
			/>
		</InfoLabelRow>
	);
};

export default RowSecondaryData;
