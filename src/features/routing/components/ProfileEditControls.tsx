/**
 * External dependencies
 */
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { get } from 'lodash-es';
import { useTheme } from 'react-native-paper';

/**
 * Internal dependencies
 */
import ToggleRowControl from '../../../components/generic/controls/ToggleRowControl';
import InfoLabelRow from '../../../components/generic/infoWrapper/InfoLabelRow';
import NumericRowControl from '../../../components/generic/controls/NumericRowControl';
import ButtonHighlightMenuControl from '../../../components/generic/wrapper/ButtonHighlightMenuControl';
import { useAppSelector } from '../../../store/hooks';
import {
	RoutingProfile,
	BrouterOptions,
	BrouterCompressionMode,
	StraightLineOptions,
} from '../types';
import { DEFAULT_OPTIONS_BROUTER, DEFAULT_OPTIONS_STRAIGHT_LINE } from '../constants';
import { formatDistanceUnit } from '../../../lib/formatting';
import { selectUnitPrefs } from '../../general/selectors';
import { selectLastProfiles } from '../selectors';
import { sharedStyles } from '../../../sharedStyles';

const providerOptions = [
	{
		key: 'brouter',
		label: 'routing.providerBrouter',
	},
	{
		key: 'straightLine',
		label: 'routing.providerStraightLine',
	},
];

const vehicleOptions = [
	{
		key: 'motorcar',
		label: 'routing.vehicleMotorcar',
	},
	{
		key: 'bicycle',
		label: 'routing.vehicleBicycle',
	},
	{
		key: 'foot',
		label: 'routing.vehicleFoot',
	},
];

const compressionModeOptions = [
	{
		key: 'off',
		label: 'routing.compressionModeOff',
	},
	{
		key: 'on',
		label: 'routing.compressionModeOn',
	},
	{
		key: 'auto',
		label: 'routing.compressionModeAuto',
	},
];

interface ProfileEditControlsProps {
	profile: RoutingProfile;
	onProfileChange: (profile: RoutingProfile) => void;
}

const ProviderRowControl: React.FC<{
	profile: RoutingProfile;
	onProfileChange: (profile: RoutingProfile) => void;
}> = ({ profile, onProfileChange }) => {
	const { t } = useTranslation();

	const selectedOpt = providerOptions.find((opt) => opt.key === profile.provider);

	const lastProfiles = useAppSelector(selectLastProfiles);

	const handleSetProvider = useCallback(
		(newProvider: string) => {
			if (newProvider === 'brouter') {
				onProfileChange({
					provider: 'brouter',
					options: (lastProfiles.profiles?.['brouter']?.options ??
						DEFAULT_OPTIONS_BROUTER) as BrouterOptions,
				});
			} else if (newProvider === 'straightLine') {
				onProfileChange({
					provider: 'straightLine',
					options: (lastProfiles.profiles?.['straightLine']?.options ??
						DEFAULT_OPTIONS_STRAIGHT_LINE) as StraightLineOptions,
				});
			}
		},
		[onProfileChange, lastProfiles]
	);

	return (
		<InfoLabelRow
			label={t('routing.provider')}
			Info={t('routing.hintProvider')}
		>
			<ButtonHighlightMenuControl
				options={providerOptions}
				value={get(selectedOpt, 'key')}
				setValue={handleSetProvider}
				anchorLabel={t(get(selectedOpt, 'label', ''))}
			/>
		</InfoLabelRow>
	);
};

const VehicleRowControl: React.FC<{
	profile: RoutingProfile;
	onProfileChange: (profile: RoutingProfile) => void;
}> = ({ profile, onProfileChange }) => {
	const { t } = useTranslation();

	const selectedOpt =
		profile.provider === 'brouter'
			? vehicleOptions.find((opt) => opt.key === (profile.options as BrouterOptions).v)
			: undefined;

	const handleSetVehicle = useCallback(
		(newValue: string) =>
			onProfileChange({
				provider: 'brouter' as const,
				options: {
					...profile.options,
					v: newValue,
				},
			} as RoutingProfile),
		[profile, onProfileChange]
	);

	if (profile.provider !== 'brouter') {
		return undefined;
	}

	return (
		<InfoLabelRow
			label={t('routing.profile')}
			Info={t('routing.hintProfile')}
		>
			<ButtonHighlightMenuControl
				options={vehicleOptions}
				value={get(selectedOpt, 'key')}
				setValue={handleSetVehicle}
				anchorLabel={t(get(selectedOpt, 'label', ''))}
			/>
		</InfoLabelRow>
	);
};

const CompressionModeRowControl: React.FC<{
	profile: RoutingProfile;
	onProfileChange: (profile: RoutingProfile) => void;
}> = ({ profile, onProfileChange }) => {
	const { t } = useTranslation();

	const selectedOpt =
		profile.provider === 'brouter'
			? compressionModeOptions.find(
					(opt) =>
						opt.key === ((profile.options as BrouterOptions).compressionMode ?? 'off')
				)
			: undefined;

	const handleSetCompressionMode = useCallback(
		(newValue: string) =>
			onProfileChange({
				provider: 'brouter' as const,
				options: {
					...(profile.options as BrouterOptions),
					compressionMode: newValue as BrouterCompressionMode,
				},
			} as RoutingProfile),
		[profile, onProfileChange]
	);

	if (profile.provider !== 'brouter') {
		return undefined;
	}

	return (
		<InfoLabelRow
			label={t('routing.compressionMode')}
			Info={t('routing.hintCompressionMode')}
		>
			<ButtonHighlightMenuControl
				options={compressionModeOptions}
				value={get(selectedOpt, 'key')}
				setValue={handleSetCompressionMode}
				anchorLabel={t(get(selectedOpt, 'label', ''))}
			/>
		</InfoLabelRow>
	);
};

const IntervalRowControl: React.FC<{
	profile: RoutingProfile;
	onProfileChange: (profile: RoutingProfile) => void;
}> = ({ profile, onProfileChange }) => {
	const { t } = useTranslation();

	const unitPrefs = useAppSelector(selectUnitPrefs);
	const distUnit = unitPrefs.distance;

	const handleSetInterval = useCallback(
		(newValue: number) => {
			onProfileChange({
				provider: 'straightLine' as const,
				options: { interval: newValue },
			} as RoutingProfile);
		},
		[onProfileChange]
	);

	const validatePositive = useCallback((val: number) => val > 0, []);

	const label = useMemo(
		() => t('routing.interval') + ' [' + formatDistanceUnit(distUnit, true) + ']',
		[t, distUnit]
	);

	if (profile.provider !== 'straightLine') {
		return undefined;
	}

	return (
		<NumericRowControl
			label={label}
			Info={t('routing.hintInterval')}
			value={profile.options.interval}
			onUpdate={handleSetInterval}
			numType="int"
			validate={validatePositive}
		/>
	);
};

const ProfileEditControls: React.FC<ProfileEditControlsProps> = ({ profile, onProfileChange }) => {
	const { t } = useTranslation();
	const theme = useTheme();

	const handleToggleFast = useCallback(() => {
		if (profile.provider !== 'brouter') {
			return;
		}
		const opts = profile.options;
		onProfileChange({
			provider: 'brouter' as const,
			options: {
				...opts,
				fast: !opts.fast,
			},
		} as RoutingProfile);
	}, [profile, onProfileChange]);

	return (
		<>
			<ProviderRowControl
				profile={profile}
				onProfileChange={onProfileChange}
			/>

			<VehicleRowControl
				profile={profile}
				onProfileChange={onProfileChange}
			/>

			{profile.provider === 'brouter' && (
				<ToggleRowControl
					label={t('routing.fast')}
					value={(profile.options as BrouterOptions).fast ?? false}
					onToggle={handleToggleFast}
					labelStyle={theme.fonts.bodyMedium}
					innerStyle={sharedStyles.alignStart}
					Info={t('routing.hintFast')}
				/>
			)}

			<CompressionModeRowControl
				profile={profile}
				onProfileChange={onProfileChange}
			/>

			<IntervalRowControl
				profile={profile}
				onProfileChange={onProfileChange}
			/>
		</>
	);
};

export default ProfileEditControls;
