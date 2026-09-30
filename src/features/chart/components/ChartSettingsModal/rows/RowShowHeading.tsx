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

const RowShowHeading: FC = () => {
	const { t } = useTranslation();
	const { settings, updateGeneral } = useContext(ChartSettingsModalContext);

	const handleToggle = useCallback(() => {
		updateGeneral({ showHeading: !settings.showHeading });
	}, [settings.showHeading, updateGeneral]);

	return (
		<ToggleRowControl
			label={t('chart.showHeading')}
			Info={t('chart.showHeadingHint')}
			value={settings.showHeading}
			onToggle={handleToggle}
		/>
	);
};

export default RowShowHeading;
