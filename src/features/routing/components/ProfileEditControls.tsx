/**
 * External dependencies
 */
import React, { useCallback, useMemo } from 'react';
import { Linking, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { get } from 'lodash-es';
import { Text, useTheme } from 'react-native-paper';
import { sprintf } from 'sprintf-js';
import { VehicleMode } from 'react-native-brouter/geojson';

/**
 * Internal dependencies
 */
import ToggleRowControl from '../../../components/generic/controls/ToggleRowControl';
import InfoLabelRow from '../../../components/generic/infoWrapper/InfoLabelRow';
import NumericRowControl from '../../../components/generic/controls/NumericRowControl';
import ButtonHighlightMenuControl from '../../../components/generic/wrapper/ButtonHighlightMenuControl';
import FileSourceRowControl from '../../../components/generic/controls/FileSourceRowControl';
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
import { selectAppDirs } from '../../dirs/selectors';
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

const profileInfoLinks = [
	{
		label: 'routing.linkBrouterProfiles',
		url: 'https://brouter.de/brouter/profiles2/',
	},
	{
		label: 'routing.linkBrouterWeb',
		url: 'https://brouter.de/brouter-web/',
	},
	{
		label: 'routing.linkBrouterCommunityProfiles',
		url: 'https://github.com/poutnikl/Brouter-profiles',
	},
];
const styleProfileInfoLink = { marginTop: 10 };
const ProfileFileInfo: React.FC<{}> = () => {
	const { t } = useTranslation();
	const theme = useTheme();
	const styleLinkText = useMemo(() => ({ color: get(theme.colors, 'link') }), [theme]);
	return (
		<View>
			<Text>{t('routing.hintProfileFile')}</Text>
			{profileInfoLinks.map((link) => (
				<View
					style={styleProfileInfoLink}
					key={link.label}
				>
					<Text>{t(link.label)}</Text>
					<Text
						style={styleLinkText}
						onPress={() => Linking.openURL(link.url)}
					>
						{link.url}
					</Text>
				</View>
			))}
		</View>
	);
};

const ProfileRowControl: React.FC<{
	profile: RoutingProfile;
	onProfileChange: (profile: RoutingProfile) => void;
}> = ({ profile, onProfileChange }) => {
	const { t } = useTranslation();

	const appDirs = useAppSelector(selectAppDirs);

	const opts = profile.provider === 'brouter' ? (profile.options as BrouterOptions) : undefined;

	const handleSelect = useCallback(
		(newValue?: string) => {
			if (!opts || !newValue) {
				return;
			}
			const vehicleKey = vehicleOptions.find((opt) => opt.key === newValue)?.key;
			if (vehicleKey) {
				onProfileChange({
					provider: 'brouter' as const,
					options: {
						...opts,
						v: vehicleKey as VehicleMode,
						profilePath: undefined,
					},
				} as RoutingProfile);
				return;
			}
			onProfileChange({
				provider: 'brouter' as const,
				options: {
					...opts,
					profilePath: newValue,
				},
			} as RoutingProfile);
		},
		[opts, onProfileChange]
	);

	const initialOptionsByPath = useMemo(
		() => ({
			[t('routing.builtInProfiles') + ':']: vehicleOptions.map((opt) => ({
				key: opt.key,
				label: t(opt.label),
			})),
		}),
		[t]
	);

	if (!opts) {
		return undefined;
	}

	return (
		<FileSourceRowControl
			label={t('routing.profile')}
			header={t('routing.selectProfile')}
			initialOptionsByPath={initialOptionsByPath}
			value={opts.profilePath ?? opts.v}
			onSelect={handleSelect}
			extensions={['brf']}
			dirs={appDirs?.brouterProfiles ?? []}
			hasCustom
			anchorButtonStyle={sharedStyles.flex1}
			Info={<ProfileFileInfo />}
			filesHeading={sprintf(t('filesIn'), '(.brf)')}
			noFilesHeading={sprintf(t('noFilesIn'), '(.brf)')}
		/>
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

	const brouterOpts =
		profile.provider === 'brouter' ? (profile.options as BrouterOptions) : undefined;

	const handleToggleFast = useCallback(() => {
		if (!brouterOpts) {
			return;
		}
		onProfileChange({
			provider: 'brouter' as const,
			options: {
				...brouterOpts,
				fast: !brouterOpts.fast,
			},
		} as RoutingProfile);
	}, [brouterOpts, onProfileChange]);

	return (
		<>
			<ProviderRowControl
				profile={profile}
				onProfileChange={onProfileChange}
			/>

			<ProfileRowControl
				profile={profile}
				onProfileChange={onProfileChange}
			/>

			{brouterOpts && (
				<ToggleRowControl
					label={t('routing.fast')}
					value={brouterOpts.fast ?? false}
					onToggle={handleToggleFast}
					disabled={!!brouterOpts.profilePath}
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
