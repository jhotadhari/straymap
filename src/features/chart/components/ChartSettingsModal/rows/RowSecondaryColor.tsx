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

const secondaryColorOptions: OptionBase[] = [
	{ key: 'axis', label: 'chart.colorAxisSecondary' },
	{ key: 'elevation', label: 'chart.colorElevation' },
	{ key: 'elevationFill', label: 'chart.colorElevationFill' },
	{ key: 'slope', label: 'chart.colorSlope' },
	{ key: 'slopeFill', label: 'chart.colorSlopeFill' },
];

const buttonPropsProps = { paddingHorizontal: true };

const RowSecondaryColor: FC = () => {
	const { t } = useTranslation();
	const { settings, update } = useContext(ChartSettingsModalContext);

	const selectedOpt = useMemo(
		() => secondaryColorOptions.find((opt) => opt.key === settings.secondaryColor),
		[settings.secondaryColor]
	);

	const handleSetValue = useCallback(
		(v: string) => update({ secondaryColor: v as ChartColorMode }),
		[update]
	);

	if (settings.secondary === 'none') {
		return null;
	}

	return (
		<InfoLabelRow
			label={t('chart.secondaryColor')}
			Info={t('chart.secondaryColorHint')}
		>
			<ButtonHighlightMenuControl
				options={secondaryColorOptions}
				value={settings.secondaryColor}
				setValue={handleSetValue}
				anchorLabel={t(selectedOpt?.label ?? '')}
				compact
				buttonPropsProps={buttonPropsProps}
			/>
		</InfoLabelRow>
	);
};

export default RowSecondaryColor;
