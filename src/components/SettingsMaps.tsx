
/**
 * External dependencies
 */
import {
	FC,
	useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import {
	ScrollView,
} from 'react-native';
import { useSafeAreaFrame } from 'react-native-safe-area-context';
import rnUuid from 'react-native-uuid';
import {
	useTheme,
} from 'react-native-paper';

/**
 * Internal dependencies
 */
import { AppContext, SettingsMapsContext } from '../Context';
import MapLayersControl, { mapTypeOptions } from './MapLayersControl';
import MapsforgeProfilesControl from './MapsforgeProfilesControl';
import { LayerConfig, LayerConfigOptionsMapsforge, LayerType, MapSettings, MapsforgeProfile } from '../types';
import { get } from 'lodash-es';
import useDeepCompareEffect from 'use-deep-compare-effect';
import SettingsMapsforgeControl from './SettingsMapsforgeControl';
import CacheManager from './CacheManager';


const getNewProfile = () : MapsforgeProfile => ( {
    key: rnUuid.v4(),
    name: '',
    theme: 'DEFAULT',
    renderStyle: null,
    renderOverlays: [],
	hasBuildings: true,
	hasLabels: true,
} );

const useProfiles = () => {

    const {
		mapSettings,
		setMapSettings,
    } = useContext( AppContext )

    const [profiles,setProfiles] = useState<MapsforgeProfile[]>( mapSettings?.mapsforgeProfiles || [] );
    const profilesRef = useRef<MapsforgeProfile[]>( profiles );
    useEffect( () => {
        profilesRef.current = profiles;
        if ( ! profiles.length ) {
            updateProfile( getNewProfile() );
        }
    }, [profiles] );

    const [editProfile, setEditProfile] = useState<null | MapsforgeProfile>( null );

    const updateProfile = ( newProfile : MapsforgeProfile ) => {
        if ( editProfile && editProfile.key === newProfile.key ) {
            setEditProfile( newProfile );
        }
        const itemIndex = profiles.findIndex( item => item.key === newProfile.key );
        if ( -1 !== itemIndex ) {
            const newProfiles = [...profiles];
            newProfiles[itemIndex] = newProfile;
            setProfiles( newProfiles );
        } else {
            setProfiles( [
                ...profiles,
                newProfile,
            ] );
        }
    };

    const saveProfiles = () => mapSettings && setMapSettings && setMapSettings( ( mapSettings: MapSettings ) => ( {
        ...mapSettings,
        mapsforgeProfiles: profilesRef.current,
    } ) );
    useEffect( () => saveProfiles, [] );    // Save on unmount.

    return {
        editProfile,
        setEditProfile,
        updateProfile,
        profiles,
        setProfiles,
        saveProfiles,
        getNewProfile,
    };
};


const getLayerType = ( layer : LayerConfig ) : ( LayerType | null ) => get( mapTypeOptions.find( opt => opt.key === layer.type ), 'type', null );

const useLayers = () => {

    const {
		mapSettings,
		setMapSettings,
    } = useContext( AppContext );

    const [layers,setLayers] = useState<LayerConfig[]>( mapSettings?.layers || [] );
    const layersRef = useRef<LayerConfig[]>( layers );
    useEffect( () => {
        layersRef.current = layers;
    }, [layers])
    const saveLayers = () => mapSettings && setMapSettings && setMapSettings( ( mapSettings: MapSettings ) => ( {
        ...mapSettings,
        layers: layersRef.current,
    } ) );
    useEffect( () => saveLayers, [] );    // Save on unmount.

    const [editLayer, setEditLayer] = useState<null | LayerConfig>( null );

    const updateLayer = ( newLayer : LayerConfig ) => {
        if ( editLayer && editLayer.key === newLayer.key ) {
            setEditLayer( newLayer );
        }
        const itemIndex = layers.findIndex( item => item.key === newLayer.key );
        if ( -1 !== itemIndex ) {
            const newLayers = [...layers];
            newLayers[itemIndex] = newLayer;
            setLayers( newLayers );
        } else {
            let insertIndex = 0;
            if ( 'base' === getLayerType( newLayer ) ) {
                const indexFirstBase = layers.findIndex( layer => 'base' === getLayerType( layer ) );
                insertIndex = indexFirstBase !== -1 ? indexFirstBase : insertIndex;
            }
            const newLayers = [...layers];
            newLayers.splice(
                insertIndex,
                0,
                newLayer
            );
            setLayers( newLayers );
        }
    };

    return {
        editLayer,
        setEditLayer,
        updateLayer,
        layers,
        setLayers,
        saveLayers,
    };

};

const SettingsMaps : FC = () => {

	const theme = useTheme();

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
    } = useProfiles();

    const {
        editLayer,
        setEditLayer,
        updateLayer,
        layers,
        setLayers,
        saveLayers,
    } = useLayers();

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
            />

            <MapsforgeProfilesControl
                setScrollEnabled={ setScrollEnabled }
            />

            <SettingsMapsforgeControl/>

            <CacheManager/>

        </ScrollView>
    </SettingsMapsContext.Provider>;
};

export default SettingsMaps;