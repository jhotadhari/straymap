/**
 * External dependencies
 */
import { FC, useState } from 'react';
import { ScrollView, ViewStyle } from 'react-native';

/**
 * Internal dependencies
 */
import LayersControl from '../../baseMap/components/controls/layers/LayersControl';
import ProfilesControl from '../../baseMap/components/controls/profiles/ProfilesControl';
import MapsforgeGeneralControl from '../../baseMap/components/controls/MapsforgeGeneralControl';
import CacheManager from '../../baseMap/components/controls/CacheManager';

const SettingsMaps: FC<{ style?: ViewStyle }> = ({ style }) => {
	const [scrollEnabled, setScrollEnabled] = useState(true);

	return (
		<ScrollView
			scrollEnabled={scrollEnabled}
			style={style}
		>
			<LayersControl
				setScrollEnabled={setScrollEnabled}
				saveOnChange={false}
				saveOnUnmount={true}
			/>

			<ProfilesControl
				setScrollEnabled={setScrollEnabled}
				saveOnChange={false}
				saveOnUnmount={true}
			/>

			<MapsforgeGeneralControl />

			<CacheManager />
		</ScrollView>
	);
};

export default SettingsMaps;
