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
import { OptionBase } from '../../../../../types';
import { ChartSeriesValue } from '../../../types';
import { ChartSettingsModalContext } from '../Context';

const primaryDataOptions: OptionBase[] = [
	{ key: 'none', label: 'chart.seriesNone' },
	{ key: 'elevation', label: 'chart.seriesElevation' },
	{ key: 'slope', label: 'chart.seriesSlope' },
];

const buttonPropsProps = { paddingHorizontal: true };

const RowPrimaryData: FC = () => {
	const { t } = useTranslation();
	const { settings, update } = useContext(ChartSettingsModalContext);

	const selectedOpt = useMemo(
		() => primaryDataOptions.find((opt) => opt.key === settings.primary),
		[settings.primary]
	);

	const handleSetValue = useCallback(
		(v: string) => update({ primary: v as ChartSeriesValue }),
		[update]
	);

	return (
		<InfoLabelRow
			label={t('chart.primaryData')}
			Info={t('chart.primaryDataHint')}
		>
			<ButtonHighlightMenuControl
				options={primaryDataOptions}
				value={settings.primary}
				setValue={handleSetValue}
				anchorLabel={t(selectedOpt?.label ?? '')}
				compact
				buttonPropsProps={buttonPropsProps}
			/>
		</InfoLabelRow>
	);
};

export default RowPrimaryData;
