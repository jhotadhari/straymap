
/**
 * External dependencies
 */
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { debounce } from 'lodash-es';

/**
 * Internal dependencies
 */
import { MapsforgeProfile } from '../types';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { selectMapsforgeProfiles } from '../selectors';
import { setMapsforgeProfiles as setProfilesStore } from '../baseMapSlice';

const useProfiles = ( {
    saveOnSet,
    saveOnSetDelay = 300,
} : {
    saveOnSet?: boolean;
    saveOnSetDelay?: number;
} ) => {

    const dispatch = useAppDispatch();

    const profilesTemp = useAppSelector( state => selectMapsforgeProfiles( state, { temp: true } ) );

    const saveProfiles = useCallback( () => {
        dispatch( setProfilesStore( { temp: false } ) );
    }, [] );

    const saveProfilesDebounced = useMemo(
        () => debounce( saveProfiles, saveOnSetDelay ),
        [saveProfiles, saveOnSetDelay]
    );

    const setProfiles = useCallback( ( newProfiles: MapsforgeProfile[] ) => {
        dispatch( setProfilesStore( {
            temp: ! saveOnSet || ( saveOnSet && saveOnSetDelay > 0 ),
            mapsforgeProfiles: newProfiles,
        } ) );
        if ( saveOnSet && saveOnSetDelay > 0 ) {
            saveProfilesDebounced();
        }
    }, [
        saveOnSet,
        saveOnSetDelay,
        saveProfilesDebounced,
    ] );

    // Save on unmount.
    useEffect( () => saveProfiles, [] );

    const [editProfile, setEditProfile] = useState<null | MapsforgeProfile>( null );

    const updateProfile = useCallback( ( newProfile : MapsforgeProfile ) => {
        if ( editProfile && editProfile.key === newProfile.key ) {
            setEditProfile( newProfile );
        }
        const itemIndex = profilesTemp.findIndex( item => item.key === newProfile.key );
        if ( -1 !== itemIndex ) {
            const newProfiles = [...profilesTemp];
            newProfiles[itemIndex] = newProfile;
            setProfiles( newProfiles );
        } else {
            setProfiles( [
                ...profilesTemp,
                newProfile,
            ] );
        }
    }, [
        setProfiles,
        profilesTemp,
        editProfile,
    ] );

    return {
        editProfile,
        setEditProfile,
        updateProfile,
        profiles: profilesTemp,
        setProfiles,
        saveProfiles,
    };
};

export default useProfiles;
