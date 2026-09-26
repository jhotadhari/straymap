/**
 * External dependencies
 */
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Divider } from 'react-native-paper';

/**
 * Internal dependencies
 */
import ModalWrapper from '../../../../components/generic/wrapper/ModalWrapper';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
	selectGeneralSettings,
	selectHasOwnProfileSettings,
	selectProfileSettings,
} from '../../selectors';
import { removeProfileSettings, setGeneralSettings, setProfileSettings } from '../../slice';
import { ProfileSettings } from '../../types';
import { ProfileSettingsModalContext, ProfileSettingsMode } from './Context';
import { sharedStyles } from './sharedDeps';
import RowSelectProfile from './rows/RowSelectProfile';
import RowProfileMode from './rows/RowProfileMode';
import RowPrimarySeries from './rows/RowPrimarySeries';
import RowSecondarySeries from './rows/RowSecondarySeries';
import RowColorMode from './rows/RowColorMode';
import RowXMode from './rows/RowXMode';
import RowShowLabel from './rows/RowShowLabel';
import RowShowStats from './rows/RowShowStats';
import RowRemoveProfile from './rows/RowRemoveProfile';

const ProfileSettingsModal: FC<{
	visible: boolean;
	setVisible: (visible: boolean) => void;
	profileKey: string;
}> = ({ visible, setVisible, profileKey }) => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();

	const settings = useAppSelector((state) => selectProfileSettings(state, profileKey));
	const generalSettings = useAppSelector(selectGeneralSettings);
	const hasOwn = useAppSelector((state) => selectHasOwnProfileSettings(state, profileKey));

	// The mode follows the current profile: 'own' only while the profile
	// has its own settings entry (copied from general on switch).
	const [mode, setModeState] = useState<ProfileSettingsMode>(hasOwn ? 'own' : 'general');

	useEffect(() => {
		setModeState(hasOwn ? 'own' : 'general');
	}, [
		profileKey,
		hasOwn,
	]);

	const onDismiss = useCallback(() => {
		setVisible(false);
	}, [setVisible]);

	const update = useCallback(
		(partial: Partial<ProfileSettings>) => {
			if (mode === 'own') {
				dispatch(setProfileSettings({ key: profileKey, settings: partial }));
			} else {
				dispatch(setGeneralSettings(partial));
			}
		},
		[
			dispatch,
			profileKey,
			mode,
		]
	);

	const setMode = useCallback(
		(nextMode: ProfileSettingsMode) => {
			if (nextMode === mode) {
				return;
			}
			if (nextMode === 'own') {
				// Copy the current general settings into the profile's own.
				dispatch(setProfileSettings({ key: profileKey, settings: generalSettings }));
			} else {
				// Discard the profile's own settings — fall back to general.
				dispatch(removeProfileSettings([profileKey]));
			}
			setModeState(nextMode);
		},
		[
			dispatch,
			profileKey,
			mode,
			generalSettings,
		]
	);

	const contextValue = useMemo(
		() => ({
			profileKey,
			settings,
			update,
			onDismiss,
			mode,
			setMode,
		}),
		[
			profileKey,
			settings,
			update,
			onDismiss,
			mode,
			setMode,
		]
	);

	return (
		<ModalWrapper
			visible={visible}
			onDismiss={onDismiss}
			headerLabel={t('altitudeProfile.settingsTitle')}
			innerStyle={sharedStyles.modalInner}
		>
			<ProfileSettingsModalContext.Provider value={contextValue}>
				<RowSelectProfile />

				<RowRemoveProfile />

				<Divider />

				<RowProfileMode />

				<RowPrimarySeries />

				<RowSecondarySeries />

				<RowColorMode />

				<RowXMode />

				<RowShowLabel />

				<RowShowStats />
			</ProfileSettingsModalContext.Provider>
		</ModalWrapper>
	);
};

export default ProfileSettingsModal;
