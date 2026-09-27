/**
 * External dependencies
 */
import React, { FC, useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import ToggleRowControl from '../../../../../components/generic/controls/ToggleRowControl';
import { useAppDispatch } from '../../../../../store/hooks';
import { setChartSettings } from '../../../slice';
import { ChartSettingsModalContext } from '../Context';

/**
 * The follow-map toggle is always per-chart ("custom"), like the ratio.
 */
const RowFollowMap: FC = () => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();
	const { chartKey, settings } = useContext(ChartSettingsModalContext);

	const handleToggle = useCallback(() => {
		dispatch(setChartSettings({ key: chartKey, settings: { followMap: !settings.followMap } }));
	}, [
		dispatch,
		chartKey,
		settings.followMap,
	]);

	return (
		<ToggleRowControl
			label={t('chart.followMap')}
			value={settings.followMap}
			onToggle={handleToggle}
		/>
	);
};

export default RowFollowMap;
