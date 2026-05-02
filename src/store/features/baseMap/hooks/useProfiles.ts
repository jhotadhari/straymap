
/**
 * External dependencies
 */
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import rnUuid from 'react-native-uuid';
import { debounce } from 'lodash-es';

/**
 * Internal dependencies
 */
import { MapsforgeProfile } from '../types';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { selectMapsforgeProfiles } from '../selectors';
import { setMapsforgeProfiles as setProfilesStore } from '../baseMapSlice';

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

    const dispatch = useAppDispatch();

    const profilesStore = useAppSelector( selectMapsforgeProfiles );

    const [profiles,setProfiles_] = useState<MapsforgeProfile[]>( profilesStore );
    const profilesRef = useRef<MapsforgeProfile[]>( profiles );

    useEffect( () => {
        setProfiles_( profilesStore );
        profilesRef.current = profilesStore;
    }, [profilesStore] );

    const saveProfiles = useCallback( () => {
        dispatch( setProfilesStore( profilesRef.current ) );
    }, [] );

    const saveProfilesDebounced = useMemo(
        () => debounce( saveProfiles, saveOnSetDelay ),
        [saveProfiles, saveOnSetDelay]
    );

    const setProfiles = useCallback( ( newProfiles: MapsforgeProfile[] ) => {
        setProfiles_( newProfiles );
        profilesRef.current = newProfiles;
        if ( saveOnSet ) {
            saveProfilesDebounced();
        }
    }, [saveOnSet,saveProfilesDebounced] );

    // Save on unmount.
    useEffect( () => saveProfiles, [] );

    const [editProfile, setEditProfile] = useState<null | MapsforgeProfile>( null );

    const updateProfile = useCallback( ( newProfile : MapsforgeProfile ) => {
        if ( editProfile && editProfile.key === newProfile.key ) {
            setEditProfile( newProfile );
        }
        const itemIndex = profiles.findIndex( item => item.key === newProfile.key );
        if ( -1 !== itemIndex ) {
            const newProfiles = [...profiles];
            newProfiles[itemIndex] = newProfile;
            setProfiles( newProfiles );
            if ( saveOnSet ) { saveProfilesDebounced() }
        } else {
            setProfiles( [
                ...profiles,
                newProfile,
            ] );
            if ( saveOnSet ) { saveProfilesDebounced() }
        }
    }, [
        profiles,
        editProfile,
        saveOnSet,
        saveProfilesDebounced,
    ] );

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
