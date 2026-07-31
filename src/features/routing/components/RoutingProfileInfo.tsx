/**
 * External dependencies
 */
import React, { FC, useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { RoutingPointInheritMode, RoutingProfile } from '../types';
import { formatDistance } from '../../../lib/formatting';
import { UnitPref } from '../../../features/general/types';

const RoutingProfileInfo: FC<{
	profile: RoutingProfile;
	inheritMode?: RoutingPointInheritMode;
	distUnit: UnitPref;
	style?: StyleProp<ViewStyle>;
}> = ({ profile, inheritMode, distUnit, style }) => {
	const { t } = useTranslation();

	const styleContainer = useMemo(() => [styles.container, style], [style]);

	return (
		<View style={styleContainer}>
			{inheritMode && inheritMode !== 'own' && (
				<Text style={styles.modeLabel}>
					{t(
						`routing.inheritMode${inheritMode.charAt(0).toUpperCase() + inheritMode.slice(1)}`
					)}
				</Text>
			)}
			{profile.provider === 'brouter' && (
				<>
					<Text>
						{t(
							`routing.vehicle${profile.options.v.charAt(0).toUpperCase() + profile.options.v.slice(1)}`
						)}
					</Text>
					<Text>{profile.options.fast ? t('routing.fast') : t('routing.slow')}</Text>
				</>
			)}
			{profile.provider === 'straightLine' && (
				<Text>
					{t('routing.providerStraightLine')}
					{', '}
					{t('routing.interval')}
					{': '}
					{formatDistance(profile.options.interval, distUnit, true)}
				</Text>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,

		// marginLeft:
	},
	modeLabel: {
		fontWeight: 'bold',
	},
});

export default RoutingProfileInfo;
