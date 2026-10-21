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

/**
 * The follow animation is always general ("applies to all charts"),
 * like the heading and statistics toggles.
 */
const RowAnimateFollow: FC = () => {
	const { t } = useTranslation();
	const { settings, updateGeneral } = useContext(ChartSettingsModalContext);

	const handleToggle = useCallback(() => {
		updateGeneral({ animateFollow: !settings.animateFollow });
	}, [
		updateGeneral,
		settings.animateFollow,
	]);

	return (
		<ToggleRowControl
			label={t('chart.animateFollow')}
			Info={t('chart.animateFollowHint')}
			value={settings.animateFollow}
			onToggle={handleToggle}
		/>
	);
};

export default RowAnimateFollow;
