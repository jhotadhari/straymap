/**
 * External dependencies
 */
import React, { FC } from 'react';
import { StyleSheet, View } from 'react-native';
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
}> = ({ profile, inheritMode, distUnit }) => {
	const { t } = useTranslation();

	return (
		<View style={styles.container}>
			{inheritMode && inheritMode !== 'own' && (
				<Text style={styles.modeLabel}>
					{t(
						`routing.inheritMode${inheritMode.charAt(0).toUpperCase() + inheritMode.slice(1)}`
					)}
				</Text>
			)}
			{profile.provider === 'brouter' && (
				<>
					<Text>{profile.options.v}</Text>
					<Text>{profile.options.fast ? t('routing.fast') : 'slow'}</Text>
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
	},
	modeLabel: {
		fontWeight: 'bold',
	},
});

export default RoutingProfileInfo;
