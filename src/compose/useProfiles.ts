
/**
 * External dependencies
 */
import {
	useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import rnUuid from 'react-native-uuid';

/**
 * Internal dependencies
 */
import { AppContext } from '../Context';
import { MapSettings, MapsforgeProfile } from '../types';
import { debounce } from 'lodash-es';

const getNewProfile = () : MapsforgeProfile => ( {
    key: rnUuid.v4(),
    name: '',
    theme: 'DEFAULT',
    renderStyle: null,
    renderOverlays: [],
	hasBuildings: true,
	hasLabels: true,
} );

const useProfiles = ( {
    saveOnSet,
    saveOnSetDelay = 0,
} : {
    saveOnSet?: boolean;
    saveOnSetDelay?: number;
} ) => {

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
    const saveProfilesDebounced = debounce( saveProfiles, saveOnSetDelay );
    // Save on unmount.
    useEffect( () => saveProfiles, [] );
    // Maybe save on setProfiles..
    useEffect( () => {
        if ( saveOnSet ) {
            saveProfilesDebounced();
        }
    }, [profiles] );

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

export default useProfiles;
