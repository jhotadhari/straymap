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
import { ProfileColorMode } from '../../../types';
import { ProfileSettingsModalContext } from '../Context';

const secondaryColorOptions: OptionBase[] = [
	{ key: 'axis', label: 'altitudeProfile.colorAxisSecondary' },
	{ key: 'primary', label: 'altitudeProfile.colorPrimaryData' },
	{ key: 'secondary', label: 'altitudeProfile.colorSecondaryData' },
];

const RowSecondaryColor: FC = () => {
	const { t } = useTranslation();
	const { settings, update } = useContext(ProfileSettingsModalContext);

	const selectedOpt = useMemo(
		() => secondaryColorOptions.find((opt) => opt.key === settings.secondaryColor),
		[settings.secondaryColor]
	);

	if (settings.secondary === 'none') {
		return null;
	}

	return (
		<InfoLabelRow label={t('altitudeProfile.secondaryColor')}>
			<ButtonHighlightMenuControl
				options={secondaryColorOptions}
				value={settings.secondaryColor}
				setValue={(v) => update({ secondaryColor: v as ProfileColorMode })}
				anchorLabel={t(selectedOpt?.label ?? '')}
				compact
				buttonPropsProps={{ paddingHorizontal: true }}
			/>
		</InfoLabelRow>
	);
};

export default RowSecondaryColor;
