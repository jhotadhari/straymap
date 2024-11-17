
/**
 * External dependencies
 */
import { ReactElement, ReactNode } from "react";
import { Style as ListStyle } from "react-native-paper/lib/typescript/components/List/utils";
import { MD3Theme } from 'react-native-paper/lib/typescript/types';

/**
 * react-native-mapsforge-vtm dependencies
 */
import {
	LayerMBTilesBitmapProps,
	LayerBitmapTileProps,
	LayerMapsforgeProps,
	LayerHillshadingProps,
} from 'react-native-mapsforge-vtm';


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


export interface LayerConfigOptionsOnlineRasterXYZ {
	url?: LayerBitmapTileProps['url'];
	cacheSize?: LayerBitmapTileProps['cacheSize'];
	enabledZoomMin?: LayerBitmapTileProps['enabledZoomMin'],
	enabledZoomMax?: LayerBitmapTileProps['enabledZoomMax'],
	zoomMin?: LayerBitmapTileProps['zoomMin'],
	zoomMax?: LayerBitmapTileProps['zoomMax'],
};

export interface LayerConfigOptionsMapsforge {
	mapFile?: LayerMapsforgeProps['mapFile'];
	renderTheme?: LayerMapsforgeProps['renderTheme'];
	renderStyle?: LayerMapsforgeProps['renderStyle'];
	renderOverlays?: LayerMapsforgeProps['renderOverlays'];
};

export interface LayerConfigOptionsRasterMBtiles {
	mapFile?: LayerMBTilesBitmapProps['mapFile'];
	enabledZoomMin?: LayerMBTilesBitmapProps['enabledZoomMin'];
	enabledZoomMax?: LayerMBTilesBitmapProps['enabledZoomMax'];
};

export interface LayerConfigOptionsHillshading {
	hgtDirPath?: LayerHillshadingProps['hgtDirPath'];
	enabledZoomMin?: LayerHillshadingProps['enabledZoomMin'];
	enabledZoomMax?: LayerHillshadingProps['enabledZoomMax'];
	zoomMin?: LayerHillshadingProps['zoomMin'];
	zoomMax?: LayerHillshadingProps['zoomMax'];
	shadingAlgorithm?: LayerHillshadingProps['shadingAlgorithm'];
	shadingAlgorithmOptions?: LayerHillshadingProps['shadingAlgorithmOptions'];
	magnitude?: LayerHillshadingProps['magnitude'];
	cacheSize?: LayerHillshadingProps['cacheSize'];
};

export type LayerConfigOptionsAny = LayerConfigOptionsOnlineRasterXYZ
	| LayerConfigOptionsMapsforge
	| LayerConfigOptionsRasterMBtiles
	| LayerConfigOptionsHillshading;

export type LayerConfig = {
    key: string;
    name: string;
    type: null | string;	// 'online-raster-xyz' | 'mapsforge' | 'raster-MBtiles' | 'hillshading';
    visible: boolean;
	options: LayerConfigOptionsAny;
};

export type MapSettings = {
	layers: LayerConfig[];
};