/**
 * External dependencies
 */
import { Dispatch, SetStateAction, createContext } from "react";

/**
 * Internal dependencies
 */
import { LayerConfig, MapsforgeProfile } from "./types";

export type ContextSettingsMapsType = {
	// layers
    layers: LayerConfig[];
    editLayer: null | LayerConfig;
    setEditLayer?: Dispatch<SetStateAction<null | LayerConfig>>
    updateLayer?: ( newLayer: LayerConfig ) => void;
    setLayers?: ( newLayers: LayerConfig[] ) => void;
    saveLayers?: () => void;
	// profiles
    profiles: MapsforgeProfile[];
    editProfile: null | MapsforgeProfile;
    setEditProfile?: Dispatch<SetStateAction<null | MapsforgeProfile>>;
    updateProfile?: ( newProfile: MapsforgeProfile ) => void;
    setProfiles?: ( newProfiles: MapsforgeProfile[] ) => void;
    saveProfiles?: () => void;
    getNewProfile?: () => MapsforgeProfile;
};

export const ContextSettingsMaps = createContext<ContextSettingsMapsType>( {
	layers: [],
    editLayer: null,
	profiles: [],
    editProfile: null,
} );