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
import { ChartColorMode } from '../../../types';
import { ChartSettingsModalContext } from '../Context';

const primaryColorOptions: OptionBase[] = [
	{ key: 'axis', label: 'chart.colorAxisPrimary' },
	{ key: 'elevation', label: 'chart.colorElevation' },
	{ key: 'elevationFill', label: 'chart.colorElevationFill' },
	{ key: 'slope', label: 'chart.colorSlope' },
	{ key: 'slopeFill', label: 'chart.colorSlopeFill' },
];

const buttonPropsProps = { paddingHorizontal: true };

const RowPrimaryColor: FC = () => {
	const { t } = useTranslation();
	const { settings, update } = useContext(ChartSettingsModalContext);

	const selectedOpt = useMemo(
		() => primaryColorOptions.find((opt) => opt.key === settings.primaryColor),
		[settings.primaryColor]
	);

	const handleSetValue = useCallback(
		(v: string) => update({ primaryColor: v as ChartColorMode }),
		[update]
	);

	if (settings.primary === 'none') {
		return null;
	}

	return (
		<InfoLabelRow
			label={t('chart.primaryColor')}
			Info={t('chart.primaryColorHint')}
		>
			<ButtonHighlightMenuControl
				options={primaryColorOptions}
				value={settings.primaryColor}
				setValue={handleSetValue}
				anchorLabel={t(selectedOpt?.label ?? '')}
				compact
				buttonPropsProps={buttonPropsProps}
			/>
		</InfoLabelRow>
	);
};

export default RowPrimaryColor;
