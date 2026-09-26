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

const primaryOptions: OptionBase[] = [
	{ key: 'elevation', label: 'altitudeProfile.seriesElevation' },
];

const RowPrimarySeries: FC = () => {
	const { t } = useTranslation();
	const { settings, update } = useContext(ProfileSettingsModalContext);

	const selectedOpt = useMemo(
		() => primaryOptions.find((opt) => opt.key === settings.primary),
		[settings.primary]
	);

	return (
		<InfoLabelRow label={t('altitudeProfile.primarySeries')}>
			<ButtonHighlightMenuControl
				options={primaryOptions}
				value={settings.primary}
				setValue={(v) => update({ primary: v as ProfileSettings['primary'] })}
				anchorLabel={t(selectedOpt?.label ?? '')}
				compact
				buttonPropsProps={{ paddingHorizontal: true }}
			/>
		</InfoLabelRow>
	);
};

export default RowPrimarySeries;
