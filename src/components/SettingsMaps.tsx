
/**
 * External dependencies
 */
import {
	FC,
	useContext,
    useState,
} from 'react';
import {
	ScrollView,
} from 'react-native';
import { useSafeAreaFrame } from 'react-native-safe-area-context';
import {
	useTheme,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { AppContext, SettingsMapsContext } from '../Context';
import MapLayersControl from './MapLayersControl';
import MapsforgeProfilesControl from './MapsforgeProfilesControl';
import { LayerConfig, LayerConfigOptionsMapsforge } from '../types';
import useDeepCompareEffect from 'use-deep-compare-effect';
import SettingsMapsforgeControl from './SettingsMapsforgeControl';
import CacheManager from './CacheManager';
import useProfiles from '../compose/useProfiles';
import useLayers from '../compose/useLayers';

const SettingsMaps : FC = () => {

	const theme = useTheme();

    const { t } = useTranslation();

	const { width } = useSafeAreaFrame();

    const {
        appInnerHeight,
    } = useContext( AppContext )

    const {
        editProfile,
        setEditProfile,
        updateProfile,
        profiles,
        setProfiles,
        saveProfiles,
        getNewProfile,
    } = useProfiles( {} );

    const {
        editLayer,
        setEditLayer,
        updateLayer,
        layers,
        setLayers,
        saveLayers,
    } = useLayers( {} );

    const [scrollEnabled,setScrollEnabled] = useState( true );

    useDeepCompareEffect( () => {
        const layerProfileExisting = ( layer: LayerConfig ) => {
            if ( 'mapsforge' !== layer.type ) {
                return false;
            }
            const options = layer.options as LayerConfigOptionsMapsforge;
            return 'default' === options.profile || !! profiles.find( prof => prof.key === options.profile );
        };
        const newLayers = [...layers].map( layer => {
            return 'mapsforge' !== layer.type ? layer : ( layerProfileExisting( layer )
                ? layer
                : {
                    ...layer,
                    options: {
                        ...layer.options,
                        profile: 'default',
                    },
                }
            );
        } );
        setLayers && setLayers( newLayers );
    }, [profiles,layers] );

    return <SettingsMapsContext.Provider value={ {
        // layers
        layers,
        editLayer,
        setEditLayer,
        updateLayer,
        setLayers,
        saveLayers,
        // profiles
        profiles,
        editProfile,
        setEditProfile,
        updateProfile,
        setProfiles,
        saveProfiles,
        getNewProfile,
	} }>
        <ScrollView
            scrollEnabled={ scrollEnabled }
            style={ {
                backgroundColor: theme.colors.background,
                height: appInnerHeight,
                width,
                position: 'absolute',
                zIndex: 9,
            } }
        >

            <MapLayersControl
                setScrollEnabled={ setScrollEnabled }
                newLabel={ t( 'map.addNewLayer' ) }
            />

            <MapsforgeProfilesControl
                setScrollEnabled={ setScrollEnabled }
                newLabel={ t( 'map.mapsforge.profileAddNew' ) }
            />

            <SettingsMapsforgeControl/>

            <CacheManager/>

        </ScrollView>
    </SettingsMapsContext.Provider>;
};

export default SettingsMaps;