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
import { setProfileSettings } from '../../../slice';
import { ProfileSettingsModalContext } from '../Context';

/**
 * The follow-map toggle is always per-profile ("custom"), like the ratio.
 */
const RowFollowMap: FC = () => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();
	const { profileKey, settings } = useContext(ProfileSettingsModalContext);

	const handleToggle = useCallback(() => {
		dispatch(
			setProfileSettings({ key: profileKey, settings: { followMap: !settings.followMap } })
		);
	}, [
		dispatch,
		profileKey,
		settings.followMap,
	]);

	return (
		<ToggleRowControl
			label={t('altitudeProfile.followMap')}
			value={settings.followMap}
			onToggle={handleToggle}
		/>
	);
};

export default RowFollowMap;
