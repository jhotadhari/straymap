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

const RowShowStats: FC = () => {
	const { t } = useTranslation();
	const { settings, updateGeneral } = useContext(ChartSettingsModalContext);

	const handleToggle = useCallback(() => {
		updateGeneral({ showStats: !settings.showStats });
	}, [settings.showStats, updateGeneral]);

	return (
		<ToggleRowControl
			label={t('chart.showStats')}
			Info={t('chart.showStatsHint')}
			value={settings.showStats}
			onToggle={handleToggle}
		/>
	);
};

export default RowShowStats;
