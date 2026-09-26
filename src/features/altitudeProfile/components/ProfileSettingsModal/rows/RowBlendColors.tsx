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

const RowBlendColors: FC = () => {
	const { t } = useTranslation();
	const { settings, update } = useContext(ProfileSettingsModalContext);

	const handleToggle = useCallback(() => {
		update({ blendColors: !settings.blendColors });
	}, [settings.blendColors, update]);

	return (
		<ToggleRowControl
			label={t('altitudeProfile.blendColors')}
			value={settings.blendColors}
			onToggle={handleToggle}
		/>
	);
};

export default RowBlendColors;
