/**
 * External dependencies
 */
import { FC, useContext, useState } from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaFrame } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { AppContext } from '../Context';
import LayersControl from '../store/features/baseMap/components/controls/layers/LayersControl';
import ProfilesControl from '../store/features/baseMap/components/controls/profiles/ProfilesControl';
import MapsforgeGeneralControl from '../store/features/baseMap/components/controls/MapsforgeGeneralControl';
import CacheManager from '../store/features/baseMap/components/controls/CacheManager';

const SettingsMaps: FC = () => {
	const theme = useTheme();

	const { t } = useTranslation();

	const { width } = useSafeAreaFrame();

	const { appInnerHeight } = useContext(AppContext);

	const [scrollEnabled, setScrollEnabled] = useState(true);

	return (
		<ScrollView
			scrollEnabled={scrollEnabled}
			style={{
				backgroundColor: theme.colors.background,
				height: appInnerHeight,
				width,
				position: 'absolute',
				zIndex: 9,
			}}
		>
			<LayersControl
				newLabel={t('map.addNewLayer')}
				setScrollEnabled={setScrollEnabled}
				saveOnChange={false}
				saveOnUnmount={true}
			/>

			<ProfilesControl
				newLabel={t('map.mapsforge.profileAddNew')}
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
