/**
 * External dependencies
 */
import {
    createContext,
    Dispatch,
    SetStateAction,
} from "react";

/**
 * Internal dependencies
 */
import { ThemeOption, OptionBase, HierarchyItem, AbsPathsMap, MapSettings, LayerConfig, MapsforgeProfile, AppearanceSettings, GeneralSettings } from "./types";

export type AppContextType = {
	appDirs?: AbsPathsMap;
	selectedTheme?: string;
	setSelectedTheme?: Dispatch<SetStateAction<string | null>>;
	themeOptions?: ThemeOption[];
	langOptions?: OptionBase[];
	changeLang?: ( newSelectedLang : string ) => void;
	selectedLang?: string;
    mapViewNativeNodeHandle?: number | null;
    mapHeight?: number;
    topAppBarHeight?: number;
	selectedHierarchyItems?: null | HierarchyItem[];
	setSelectedHierarchyItems?: Dispatch<SetStateAction<null | HierarchyItem[]>>;
	mapSettings?: MapSettings;
	setMapSettings?: Dispatch<SetStateAction<MapSettings>>;
	appearanceSettings?: AppearanceSettings;
	setAppearanceSettings?: Dispatch<SetStateAction<AppearanceSettings>>;
	generalSettings?: GeneralSettings;
	setGeneralSettings?: Dispatch<SetStateAction<GeneralSettings>>;
    isBusy?: boolean;
    setMaybeIsBusy?: Dispatch<SetStateAction<boolean>>;
};

export const AppContext = createContext<AppContextType>( {} );

export type SettingsMapsContextType = {
	// layers
    layers: LayerConfig[];
    editLayer: null | LayerConfig;
    setEditLayer?: Dispatch<SetStateAction<null | LayerConfig>>
    updateLayer?: ( newLayer: LayerConfig ) => void;
    setLayers?: Dispatch<SetStateAction<LayerConfig[]>>;
    saveLayers?: () => void;
	// profiles
    profiles: MapsforgeProfile[];
    editProfile: null | MapsforgeProfile;
    setEditProfile?: Dispatch<SetStateAction<null | MapsforgeProfile>>;
    updateProfile?: ( newProfile: MapsforgeProfile ) => void;
    setProfiles?: Dispatch<SetStateAction<MapsforgeProfile[]>>;
    saveProfiles?: () => void;
    getNewProfile?: () => MapsforgeProfile;
};

export const SettingsMapsContext = createContext<SettingsMapsContextType>( {
	layers: [],
    editLayer: null,
	profiles: [],
    editProfile: null,
} );