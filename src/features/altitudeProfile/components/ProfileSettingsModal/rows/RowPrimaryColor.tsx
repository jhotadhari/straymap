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

const primaryColorOptions: OptionBase[] = [
	{ key: 'axis', label: 'altitudeProfile.colorAxisPrimary' },
	{ key: 'primary', label: 'altitudeProfile.colorPrimaryData' },
	{ key: 'secondary', label: 'altitudeProfile.colorSecondaryData' },
];

const RowPrimaryColor: FC = () => {
	const { t } = useTranslation();
	const { settings, update } = useContext(ProfileSettingsModalContext);

	const selectedOpt = useMemo(
		() => primaryColorOptions.find((opt) => opt.key === settings.primaryColor),
		[settings.primaryColor]
	);

	if (settings.primary === 'none') {
		return null;
	}

	return (
		<InfoLabelRow label={t('altitudeProfile.primaryColor')}>
			<ButtonHighlightMenuControl
				options={primaryColorOptions}
				value={settings.primaryColor}
				setValue={(v) => update({ primaryColor: v as ProfileColorMode })}
				anchorLabel={t(selectedOpt?.label ?? '')}
				compact
				buttonPropsProps={{ paddingHorizontal: true }}
			/>
		</InfoLabelRow>
	);
};

export default RowPrimaryColor;
