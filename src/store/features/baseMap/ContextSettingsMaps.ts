/**
 * External dependencies
 */
import { Dispatch, SetStateAction, createContext } from "react";

/**
 * Internal dependencies
 */
import { MapsforgeProfile } from "./types";

export type ContextSettingsMapsType = {
	// profiles
    profiles: MapsforgeProfile[];
    editProfile: null | MapsforgeProfile;
    setEditProfile: Dispatch<SetStateAction<null | MapsforgeProfile>>;
    updateProfile: ( newProfile: MapsforgeProfile ) => void;
    setProfiles: ( newProfiles: MapsforgeProfile[] ) => void;
    saveProfiles: () => void;
};

export const ContextSettingsMaps = createContext<ContextSettingsMapsType>( {
    profiles: [],
    editProfile: null,
    setEditProfile: () => null,
    updateProfile: () => null,
    setProfiles: () => null,
    saveProfiles: () => null,
} );