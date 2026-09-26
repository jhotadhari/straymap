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

const xOptions: OptionBase[] = [{ key: 'distance', label: 'altitudeProfile.xDistance' }];

const RowXMode: FC = () => {
	const { t } = useTranslation();
	const { settings, update } = useContext(ProfileSettingsModalContext);

	const selectedOpt = useMemo(
		() => xOptions.find((opt) => opt.key === settings.xMode),
		[
			settings.xMode,
		]
	);

	return (
		<InfoLabelRow label={t('altitudeProfile.xMode')}>
			<ButtonHighlightMenuControl
				options={xOptions}
				value={settings.xMode}
				setValue={(v) => update({ xMode: v as ProfileSettings['xMode'] })}
				anchorLabel={t(selectedOpt?.label ?? '')}
				compact
				buttonPropsProps={{ paddingHorizontal: true }}
			/>
		</InfoLabelRow>
	);
};

export default RowXMode;
