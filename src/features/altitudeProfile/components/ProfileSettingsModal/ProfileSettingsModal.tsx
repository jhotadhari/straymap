/**
 * External dependencies
 */
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { omit, pick } from 'lodash-es';
import { useTranslation } from 'react-i18next';
import { Divider } from 'react-native-paper';

/**
 * Internal dependencies
 */
import ModalWrapper from '../../../../components/generic/wrapper/ModalWrapper';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
	PER_PROFILE_SETTINGS_KEYS,
	selectGeneralSettings,
	selectHasOwnProfileSettings,
	selectOwnPerProfileSettings,
	selectProfileSettings,
} from '../../selectors';
import {
	resetProfileSettingsToPerProfile,
	setGeneralSettings,
	setProfileSettings,
} from '../../slice';
import { ProfileSettings } from '../../types';
import { ProfileSettingsModalContext, ProfileSettingsMode } from './Context';
import { sharedStyles } from './sharedDeps';
import RowSelectProfile from './rows/RowSelectProfile';
import RowProfileMode from './rows/RowProfileMode';
import RowPrimaryData from './rows/RowPrimaryData';
import RowPrimaryColor from './rows/RowPrimaryColor';
import RowSecondaryData from './rows/RowSecondaryData';
import RowSecondaryColor from './rows/RowSecondaryColor';
import RowRatioLock from './rows/RowRatioLock';
import RowFollowMap from './rows/RowFollowMap';
// import RowXMode from './rows/RowXMode';
import RowShowLabel from './rows/RowShowLabel';
import RowShowStats from './rows/RowShowStats';
import RowBlendColors from './rows/RowBlendColors';
import RowRemoveProfile from './rows/RowRemoveProfile';

const ProfileSettingsModal: FC<{
	visible: boolean;
	setVisible: (visible: boolean) => void;
	profileKey: string;
	currentRatio?: number;
	fitRatio?: number;
	onFitScreen?: () => void;
}> = ({ visible, setVisible, profileKey, currentRatio, fitRatio, onFitScreen }) => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();

	const settings = useAppSelector((state) => selectProfileSettings(state, profileKey));
	const generalSettings = useAppSelector(selectGeneralSettings);
	const hasOwn = useAppSelector((state) => selectHasOwnProfileSettings(state, profileKey));
	const ownPerProfileSettings = useAppSelector((state) =>
		selectOwnPerProfileSettings(state, profileKey)
	);

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
				// Copy the current general settings into the profile's own,
				// preserving its always-per-profile settings (ratio,
				// follow-map).
				dispatch(
					setProfileSettings({
						key: profileKey,
						settings: {
							...omit(generalSettings, PER_PROFILE_SETTINGS_KEYS),
							...pick(ownPerProfileSettings, PER_PROFILE_SETTINGS_KEYS),
						},
					})
				);
			} else {
				// Discard the profile's own settings — fall back to general,
				// keeping the per-profile settings.
				dispatch(resetProfileSettingsToPerProfile(profileKey));
			}
			setModeState(nextMode);
		},
		[
			dispatch,
			profileKey,
			mode,
			generalSettings,
			ownPerProfileSettings,
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
			currentRatio,
			fitRatio,
			onFitScreen,
		}),
		[
			profileKey,
			settings,
			update,
			onDismiss,
			mode,
			setMode,
			currentRatio,
			fitRatio,
			onFitScreen,
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

				<RowFollowMap />

				<RowRatioLock />

				<RowRemoveProfile />

				<Divider />

				<RowProfileMode />

				<RowPrimaryData />

				<RowPrimaryColor />

				<RowSecondaryData />

				<RowSecondaryColor />

				{/* <RowXMode /> */}

				<RowShowLabel />

				<RowShowStats />

				<RowBlendColors />
			</ProfileSettingsModalContext.Provider>
		</ModalWrapper>
	);
};

export default ProfileSettingsModal;
