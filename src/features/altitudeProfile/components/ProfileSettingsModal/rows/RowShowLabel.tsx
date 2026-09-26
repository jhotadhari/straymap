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

const RowShowLabel: FC = () => {
	const { t } = useTranslation();
	const { settings, update } = useContext(ProfileSettingsModalContext);

	const handleToggle = useCallback(() => {
		update({ showLabel: !settings.showLabel });
	}, [settings.showLabel, update]);

	return (
		<ToggleRowControl
			label={t('altitudeProfile.showLabel')}
			value={settings.showLabel}
			onToggle={handleToggle}
		/>
	);
};

export default RowShowLabel;
