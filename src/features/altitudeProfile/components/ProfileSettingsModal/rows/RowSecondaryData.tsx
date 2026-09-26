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
import { ProfileSeriesValue } from '../../../types';
import { ProfileSettingsModalContext } from '../Context';

const secondaryDataOptions: OptionBase[] = [
	{ key: 'none', label: 'altitudeProfile.seriesNone' },
	{ key: 'elevation', label: 'altitudeProfile.seriesElevation' },
	{ key: 'slope', label: 'altitudeProfile.seriesSlope' },
];

const RowSecondaryData: FC = () => {
	const { t } = useTranslation();
	const { settings, update } = useContext(ProfileSettingsModalContext);

	const selectedOpt = useMemo(
		() => secondaryDataOptions.find((opt) => opt.key === settings.secondary),
		[settings.secondary]
	);

	return (
		<InfoLabelRow label={t('altitudeProfile.secondaryData')}>
			<ButtonHighlightMenuControl
				options={secondaryDataOptions}
				value={settings.secondary}
				setValue={(v) => update({ secondary: v as ProfileSeriesValue })}
				anchorLabel={t(selectedOpt?.label ?? '')}
				compact
				buttonPropsProps={{ paddingHorizontal: true }}
			/>
		</InfoLabelRow>
	);
};

export default RowSecondaryData;
