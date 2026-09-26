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

const primaryDataOptions: OptionBase[] = [
	{ key: 'none', label: 'altitudeProfile.seriesNone' },
	{ key: 'elevation', label: 'altitudeProfile.seriesElevation' },
	{ key: 'slope', label: 'altitudeProfile.seriesSlope' },
];

const RowPrimaryData: FC = () => {
	const { t } = useTranslation();
	const { settings, update } = useContext(ProfileSettingsModalContext);

	const selectedOpt = useMemo(
		() => primaryDataOptions.find((opt) => opt.key === settings.primary),
		[settings.primary]
	);

	return (
		<InfoLabelRow label={t('altitudeProfile.primaryData')}>
			<ButtonHighlightMenuControl
				options={primaryDataOptions}
				value={settings.primary}
				setValue={(v) => update({ primary: v as ProfileSeriesValue })}
				anchorLabel={t(selectedOpt?.label ?? '')}
				compact
				buttonPropsProps={{ paddingHorizontal: true }}
			/>
		</InfoLabelRow>
	);
};

export default RowPrimaryData;
