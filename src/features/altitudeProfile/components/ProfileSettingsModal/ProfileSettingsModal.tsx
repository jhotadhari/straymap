/**
 * External dependencies
 */
import React, { FC, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Divider } from 'react-native-paper';

/**
 * Internal dependencies
 */
import ModalWrapper from '../../../../components/generic/wrapper/ModalWrapper';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { selectProfileSettings } from '../../selectors';
import { setProfileSettings } from '../../slice';
import { ProfileSettings } from '../../types';
import { ProfileSettingsModalContext } from './Context';
import { sharedStyles } from './sharedDeps';
import RowSelectProfile from './rows/RowSelectProfile';
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

	const onDismiss = useCallback(() => {
		setVisible(false);
	}, [setVisible]);

	const update = useCallback(
		(partial: Partial<ProfileSettings>) => {
			dispatch(setProfileSettings({ key: profileKey, settings: partial }));
		},
		[dispatch, profileKey]
	);

	const contextValue = useMemo(
		() => ({
			profileKey,
			settings,
			update,
			onDismiss,
		}),
		[
			profileKey,
			settings,
			update,
			onDismiss,
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
