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
import { ChartSettings } from '../../../types';
import { ChartSettingsModalContext } from '../Context';

const xOptions: OptionBase[] = [{ key: 'distance', label: 'chart.xDistance' }];

const RowXMode: FC = () => {
	const { t } = useTranslation();
	const { settings, update } = useContext(ChartSettingsModalContext);

	const selectedOpt = useMemo(
		() => xOptions.find((opt) => opt.key === settings.xMode),
		[
			settings.xMode,
		]
	);

	return (
		<InfoLabelRow label={t('chart.xMode')}>
			<ButtonHighlightMenuControl
				options={xOptions}
				value={settings.xMode}
				setValue={(v) => update({ xMode: v as ChartSettings['xMode'] })}
				anchorLabel={t(selectedOpt?.label ?? '')}
				compact
				buttonPropsProps={{ paddingHorizontal: true }}
			/>
		</InfoLabelRow>
	);
};

export default RowXMode;
