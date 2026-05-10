/**
 * External dependencies
 */
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { get } from 'lodash-es';
import { sprintf } from 'sprintf-js';

/**
 * Internal dependencies
 */
import InfoRowControl from '../../../../../../components/generic/InfoRowControl';
import { MapsforgeProfile, LayerConfigOptionsMapsforge } from '../../../types';
import { useAppSelector } from '../../../../../hooks';
import { selectLayers, selectMapsforgeProfiles } from '../../../selectors';
import { useMemo } from 'react';

const LayerCount = ({ profile }: { profile: MapsforgeProfile }) => {
	const { t } = useTranslation();
	const layers = useAppSelector((state) => selectLayers(state, { temp: true }));
	const profiles = useAppSelector((state) => selectMapsforgeProfiles(state, { temp: true }));

	const isDefaultProfile = useMemo(
		() => profiles.length && profiles[0].key === profile.key,
		[profiles, profile]
	);

	const layersCount = useMemo(
		() =>
			layers.filter(
				(lay) =>
					lay.type === 'mapsforge' &&
					get(lay.options as LayerConfigOptionsMapsforge, 'profile') === profile.key
			).length,
		[layers, profile]
	);

	const layersCountDefault = useMemo(
		() =>
			isDefaultProfile
				? layers.filter(
						(lay) =>
							lay.type === 'mapsforge' &&
							get(lay.options as LayerConfigOptionsMapsforge, 'profile') === 'default'
					).length
				: 0,
		[
			isDefaultProfile,
			layers,
		]
	);

	return (
		<InfoRowControl label={t('layer', { count: 0 })}>
			<View style={styles.content}>
				<Text style={styles.listItem}>
					{sprintf(t('layerSelectedCount', { count: layersCount }), layersCount)}
				</Text>
				{isDefaultProfile && (
					<Text style={styles.listItem}>
						{sprintf(
							t('layerSelectedDefaultCount', { count: layersCountDefault }),
							layersCountDefault
						)}
					</Text>
				)}
			</View>
		</InfoRowControl>
	);
};

const styles = StyleSheet.create({
	content: { paddingLeft: 12, marginBottom: -10 },
	listItem: { maxWidth: '80%', marginBottom: 10 },
});

export default LayerCount;
