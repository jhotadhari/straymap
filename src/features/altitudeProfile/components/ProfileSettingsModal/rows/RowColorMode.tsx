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

const colorOptions: OptionBase[] = [
	{ key: 'axis', label: 'altitudeProfile.colorAxis' },
	{ key: 'slope', label: 'altitudeProfile.colorSlope' },
];

const RowColorMode: FC = () => {
	const { t } = useTranslation();
	const { settings, update } = useContext(ProfileSettingsModalContext);

	const selectedOpt = useMemo(
		() => colorOptions.find((opt) => opt.key === settings.colorMode),
		[settings.colorMode]
	);

	if (settings.primary !== 'elevation') {
		return null;
	}

	return (
		<InfoLabelRow label={t('altitudeProfile.colorMode')}>
			<ButtonHighlightMenuControl
				options={colorOptions}
				value={settings.colorMode}
				setValue={(v) => update({ colorMode: v as ProfileSettings['colorMode'] })}
				anchorLabel={t(selectedOpt?.label ?? '')}
				compact
				buttonPropsProps={{ paddingHorizontal: true }}
			/>
		</InfoLabelRow>
	);
};

export default RowColorMode;
