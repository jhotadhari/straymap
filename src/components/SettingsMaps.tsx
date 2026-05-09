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
import LayersControl from '../store/features/baseMap/components/controls/LayersControl';
import ProfilesControl from '../store/features/baseMap/components/controls/ProfilesControl';
import MapsforgeGeneralControl from '../store/features/baseMap/components/controls/MapsforgeGeneralControl';
import CacheManager from './CacheManager';
import useProfiles from '../store/features/baseMap/hooks/useProfiles';
import { ContextSettingsMaps } from '../store/features/baseMap/ContextSettingsMaps';

const SettingsMaps: FC = () => {
	const theme = useTheme();

	const { t } = useTranslation();

	const { width } = useSafeAreaFrame();

	const { appInnerHeight } = useContext(AppContext);

	const { editProfile, setEditProfile, updateProfile, profiles, setProfiles, saveProfiles } =
		useProfiles({});

	const [scrollEnabled, setScrollEnabled] = useState(true);

	return (
		<ContextSettingsMaps.Provider
			value={{
				// profiles
				profiles,
				editProfile,
				setEditProfile,
				updateProfile,
				setProfiles,
				saveProfiles,
			}}
		>
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

				{/* <ProfilesControl
                setScrollEnabled={ setScrollEnabled }
                newLabel={ t( 'map.mapsforge.profileAddNew' ) }
            /> */}

				<MapsforgeGeneralControl />

				{/* <CacheManager/> */}
			</ScrollView>
		</ContextSettingsMaps.Provider>
	);
};

export default SettingsMaps;
