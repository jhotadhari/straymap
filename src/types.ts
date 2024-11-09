import { ReactElement, ReactNode } from "react";
import { Style as ListStyle } from "react-native-paper/lib/typescript/components/List/utils";
import { MD3Theme } from 'react-native-paper/lib/typescript/types';

export type AbsPath = `/${string}`;

export type AbsPathsMap = { [value: string]: AbsPath[] };

export interface MenuItem {
	key: string;
	leadingIcon: string;
	label: string;
	hierarchyIncludeParents?: boolean;
	SubActivity?: ReactElement;
	children?: MenuItem[];
};

export interface SettingsItem {
	key: string;
	left?: ( ( props: {
		color: string;
		style: ListStyle;
	} ) => ReactNode );
	label: string;
	description?: string;
	SubActivity?: ReactElement;
	children?: SettingsItem[];
};

export interface ThemePropExtended extends MD3Theme {
    label?: string;
};

export interface OptionBase {
	key: string;
	label: string;
};

export interface ThemeOption extends OptionBase {
	value: ThemePropExtended;
};

export type HierarchyItem = MenuItem | SettingsItem;


export interface MapConfigOptionsBase {
	zoomMin?: number,
	zoomMax?: number,
};

export interface MapConfigOptionsOnlineRasterXYZ extends MapConfigOptionsBase {
	url?: string;
	cacheSize?: number;
};

export interface MapConfigOptionsMapsforge extends MapConfigOptionsBase {
	mapFile?: string;
	renderTheme?: string;
	renderStyle?: string;
	renderOverlays?: string[];
};

export interface MapConfigOptionsRasterMBtiles extends MapConfigOptionsBase {
	mapFile?: string;
};

export interface MapConfigOptionsHillshading extends MapConfigOptionsBase {
	hgtDirPath?: string;
	shadingAlgorithm?: string;
	shadingAlgorithmOptions?: {};
	magnitude?: number;
	cacheSize?: number;
};

export type MapConfigOptionsAny = MapConfigOptionsOnlineRasterXYZ
	| MapConfigOptionsMapsforge
	| MapConfigOptionsRasterMBtiles
	| MapConfigOptionsHillshading

export type MapConfig = {
    key: string;
    name: string;
    type: null | string;	// 'online-raster-xyz' | 'mapsforge' | 'raster-MBtiles' | 'hillshading';
    visible: boolean;
	options: MapConfigOptionsAny;
};