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
import { ProfileSettings } from '../../../types';
import { ProfileSettingsModalContext } from '../Context';

const secondaryOptions: OptionBase[] = [
	{ key: 'none', label: 'altitudeProfile.seriesNone' },
	{ key: 'slope', label: 'altitudeProfile.seriesSlope' },
];

const RowSecondarySeries: FC = () => {
	const { t } = useTranslation();
	const { settings, update } = useContext(ProfileSettingsModalContext);

	const selectedOpt = useMemo(
		() => secondaryOptions.find((opt) => opt.key === settings.secondary),
		[settings.secondary]
	);

	return (
		<InfoLabelRow label={t('altitudeProfile.secondarySeries')}>
			<ButtonHighlightMenuControl
				options={secondaryOptions}
				value={settings.secondary}
				setValue={(v) => update({ secondary: v as ProfileSettings['secondary'] })}
				anchorLabel={t(selectedOpt?.label ?? '')}
				compact
				buttonPropsProps={{ paddingHorizontal: true }}
			/>
		</InfoLabelRow>
	);
};

export default RowSecondarySeries;
