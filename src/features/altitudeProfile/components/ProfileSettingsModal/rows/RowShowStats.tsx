/**
 * External dependencies
 */
import React, { FC, useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import ToggleRowControl from '../../../../../components/generic/controls/ToggleRowControl';
import { ProfileSettingsModalContext } from '../Context';

const RowShowStats: FC = () => {
	const { t } = useTranslation();
	const { settings, update } = useContext(ProfileSettingsModalContext);

	const handleToggle = useCallback(() => {
		update({ showStats: !settings.showStats });
	}, [settings.showStats, update]);

	return (
		<ToggleRowControl
			label={t('altitudeProfile.showStats')}
			value={settings.showStats}
			onToggle={handleToggle}
		/>
	);
};

export default RowShowStats;
