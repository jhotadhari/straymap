/**
 * External dependencies
 */
import React, { Dispatch, FC, SetStateAction, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

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
import RowPrimarySeries from './rows/RowPrimarySeries';
import RowSecondarySeries from './rows/RowSecondarySeries';
import RowColorMode from './rows/RowColorMode';
import RowXMode from './rows/RowXMode';
import RowRemoveProfile from './rows/RowRemoveProfile';

const ProfileSettingsModal: FC<{
	visible: boolean;
	setVisible: Dispatch<SetStateAction<boolean>>;
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
				<RowPrimarySeries />

				<RowSecondarySeries />

				<RowColorMode />

				<RowXMode />

				<RowRemoveProfile />
			</ProfileSettingsModalContext.Provider>
		</ModalWrapper>
	);
};

export default ProfileSettingsModal;
