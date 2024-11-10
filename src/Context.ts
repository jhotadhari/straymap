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
import { ThemeOption, OptionBase, HierarchyItem, AbsPathsMap, MapSettings } from "./types";

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
	setMapSettings?: ( newMapSettings : MapSettings ) => void;
};

export const AppContext = createContext<AppContextType>( {} );