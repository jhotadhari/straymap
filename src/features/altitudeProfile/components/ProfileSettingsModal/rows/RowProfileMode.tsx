/**
 * External dependencies
 */
import React, { FC, useContext, useMemo } from 'react';
import { SegmentedButtons, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { ProfileSettingsMode, ProfileSettingsModalContext } from '../Context';

const RowProfileMode: FC = () => {
	const { t } = useTranslation();
	const theme = useTheme();

	const { mode, setMode } = useContext(ProfileSettingsModalContext);

	const segmentedButtonsTheme = useMemo(
		() => ({
			colors: {
				secondaryContainer: theme.colors.primaryContainer,
				textColor: theme.colors.onPrimaryContainer,
			},
		}),
		[theme.colors.primaryContainer, theme.colors.onPrimaryContainer]
	);

	const segmentButtons = useMemo(
		() => [
			{
				value: 'general',
				label: t('altitudeProfile.profileModeDefault'),
			},
			{
				value: 'own',
				label: t('altitudeProfile.profileModeCustom'),
			},
		],
		[t]
	);

	const hint = useMemo(
		() =>
			mode === 'own'
				? t('altitudeProfile.profileModeHintCustom')
				: t('altitudeProfile.profileModeHintDefault'),
		[
			mode,
			t,
		]
	);

	return (
		<>
			<SegmentedButtons
				value={mode}
				onValueChange={(v) => setMode(v as ProfileSettingsMode)}
				theme={segmentedButtonsTheme}
				buttons={segmentButtons}
			/>
			<Text
				variant="bodySmall"
				style={{ color: theme.colors.onSurfaceVariant }}
			>
				{hint}
			</Text>
		</>
	);
};

export default RowProfileMode;
