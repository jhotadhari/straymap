
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
	useWindowDimensions,
	ScrollView,
} from 'react-native';
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
import { LayerConfig, LayerType, MapSettings, MapsforgeProfile } from '../types';
import { get } from 'lodash-es';


const getNewProfile = () : MapsforgeProfile => ( {
    key: rnUuid.v4(),
    name: '',
    theme: 'DEFAULT',
    renderStyle: null,
    renderOverlays: [],
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

    console.log( 'debug useLayers editLayer', editLayer ); // debug

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

	const { width } = useWindowDimensions();

    const {
        mapHeight,
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
        <ScrollView style={ {
            backgroundColor: theme.colors.background,
            height: mapHeight,
            width,
            position: 'absolute',
            zIndex: 9,
        } } >

            <MapLayersControl/>

            <MapsforgeProfilesControl/>

        </ScrollView>
    </SettingsMapsContext.Provider>;
};

export default SettingsMaps;