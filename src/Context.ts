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
import { ThemeOption, OptionBase, HierarchyItem } from "./types";

export type AppContextType = {
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
};

export const AppContext = createContext<AppContextType>( {} );