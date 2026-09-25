/**
 * External dependencies
 */
import React, { Dispatch, FC, SetStateAction, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import ModalWrapper from '../../../components/generic/wrapper/ModalWrapper';
import ListItemMenuControl from '../../../components/generic/wrapper/ListItemMenuControl';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { selectProfileSettings } from '../selectors';
import { setProfileSettings } from '../slice';
import { ProfileSettings } from '../types';
import { OptionBase } from '../../../types';

const primaryOptions: OptionBase[] = [
	{ key: 'elevation', label: 'altitudeProfile.seriesElevation' },
];

const secondaryOptions: OptionBase[] = [
	{ key: 'none', label: 'altitudeProfile.seriesNone' },
	{ key: 'slope', label: 'altitudeProfile.seriesSlope' },
];

const colorOptions: OptionBase[] = [
	{ key: 'axis', label: 'altitudeProfile.colorAxis' },
	{ key: 'slope', label: 'altitudeProfile.colorSlope' },
];

const xOptions: OptionBase[] = [{ key: 'distance', label: 'altitudeProfile.xDistance' }];

const ProfileSettingsModal: FC<{
	visible: boolean;
	setVisible: Dispatch<SetStateAction<boolean>>;
	profileKey: string;
}> = ({ visible, setVisible, profileKey }) => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();

	const settings = useAppSelector((state) => selectProfileSettings(state, profileKey));

	const update = useCallback(
		(partial: Partial<ProfileSettings>) => {
			dispatch(setProfileSettings({ key: profileKey, settings: partial }));
		},
		[dispatch, profileKey]
	);

	return (
		<ModalWrapper
			visible={visible}
			onDismiss={() => setVisible(false)}
			headerLabel={t('altitudeProfile.settingsTitle')}
		>
			<ListItemMenuControl
				anchorLabel={t('altitudeProfile.primarySeries')}
				options={primaryOptions}
				value={settings.primary}
				setValue={(v) => update({ primary: v as ProfileSettings['primary'] })}
				anchorLabelAppendSelected
			/>

			<ListItemMenuControl
				anchorLabel={t('altitudeProfile.secondarySeries')}
				options={secondaryOptions}
				value={settings.secondary}
				setValue={(v) => update({ secondary: v as ProfileSettings['secondary'] })}
				anchorLabelAppendSelected
			/>

			{settings.primary === 'elevation' && (
				<ListItemMenuControl
					anchorLabel={t('altitudeProfile.colorMode')}
					options={colorOptions}
					value={settings.colorMode}
					setValue={(v) => update({ colorMode: v as ProfileSettings['colorMode'] })}
					anchorLabelAppendSelected
				/>
			)}

			<ListItemMenuControl
				anchorLabel={t('altitudeProfile.xMode')}
				options={xOptions}
				value={settings.xMode}
				setValue={(v) => update({ xMode: v as ProfileSettings['xMode'] })}
				anchorLabelAppendSelected
			/>
		</ModalWrapper>
	);
};

export default ProfileSettingsModal;
