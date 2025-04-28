/**
 * External dependencies
 */
import {
    createContext,
    Dispatch,
    SetStateAction,
} from "react";
import { MapEventResponse } from "react-native-mapsforge-vtm";

/**
 * Internal dependencies
 */
import { ThemeOption, OptionBase, HierarchyItem, AbsPathsMap, MapSettings, LayerConfig, MapsforgeProfile, AppearanceSettings, GeneralSettings, UiState, RoutingSegment, RoutingPoint, RoutingTriggeredSegment, BottomBarHeight } from "./types";

export type AppContextType = {
	appDirs?: AbsPathsMap;
	selectedTheme?: string;
	setSelectedTheme?: Dispatch<SetStateAction<string | null>>;
	themeOptions?: ThemeOption[];
	langOptions?: OptionBase[];
	changeLang?: ( newSelectedLang : string ) => void;
	selectedLang?: string;
    mapViewNativeNodeHandle?: number | null;
    appInnerHeight?: number;
    topAppBarHeight?: number;
    bottomBarHeight?: BottomBarHeight;
	selectedHierarchyItems?: null | HierarchyItem[];
	setSelectedHierarchyItems?: Dispatch<SetStateAction<null | HierarchyItem[]>>;
	mapSettings?: MapSettings;
	setMapSettings?: Dispatch<SetStateAction<MapSettings>>;
	uiState?: UiState;
	setUiState?: Dispatch<SetStateAction<UiState>>;
	appearanceSettings?: AppearanceSettings;
	setAppearanceSettings?: Dispatch<SetStateAction<AppearanceSettings>>;
	generalSettings?: GeneralSettings;
	setGeneralSettings?: Dispatch<SetStateAction<GeneralSettings>>;
    isBusy?: boolean;
	maybeIsBusyAdd?: ( key: string ) => void;
	maybeIsBusyRemove?: ( key: string ) => void;
    currentMapEvent?: MapEventResponse;
    mapHeight?: number;
};

export const AppContext = createContext<AppContextType>( {} );

export type RoutingContextType = {
    savedExported?: {
        saved: boolean,
        exported: boolean,
    };
    setSavedExported?: Dispatch<SetStateAction<{
        saved: boolean,
        exported: boolean,
    }>>;
    isRouting?: boolean;
    setIsRouting?: Dispatch<SetStateAction<boolean>>;
    points?: RoutingPoint[];
    setPoints?: Dispatch<SetStateAction<RoutingPoint[]>>;
    segments?: RoutingSegment[];
    setSegments?: Dispatch<SetStateAction<RoutingSegment[]>>;
    markerLayerUuid?: null | string;
    setMarkerLayerUuid?: Dispatch<SetStateAction<null | string>>;
    pathLayerUuids?: null | string[];
    setPathLayerUuids?: Dispatch<SetStateAction<null | string[]>>;
    triggeredMarkerIdx?: number
    setTriggeredMarkerIdx?: Dispatch<SetStateAction<undefined | number>>;
    triggeredSegment?: RoutingTriggeredSegment;
    setTriggeredSegment?: Dispatch<SetStateAction<undefined | RoutingTriggeredSegment>>;
};

export const RoutingContext = createContext<RoutingContextType>( {} );

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