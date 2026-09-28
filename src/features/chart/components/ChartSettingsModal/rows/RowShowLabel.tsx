/**
 * External dependencies
 */
import React, { FC, useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import ToggleRowControl from '../../../../../components/generic/controls/ToggleRowControl';
import { ChartSettingsModalContext } from '../Context';

const RowShowLabel: FC = () => {
	const { t } = useTranslation();
	const { settings, updateGeneral } = useContext(ChartSettingsModalContext);

	const handleToggle = useCallback(() => {
		updateGeneral({ showLabel: !settings.showLabel });
	}, [settings.showLabel, updateGeneral]);

	return (
		<ToggleRowControl
			label={t('chart.showLabel')}
			Info={t('chart.showLabelHint')}
			value={settings.showLabel}
			onToggle={handleToggle}
		/>
	);
};

export default RowShowLabel;
