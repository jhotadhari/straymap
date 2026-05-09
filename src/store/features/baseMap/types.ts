/**
 * External dependencies
 */
import {
	LayerMBTilesBitmapProps,
	LayerBitmapTileProps,
	LayerMapsforgeProps,
	LayerHillshadingProps,
	MapContainerProps,
	RenderStyleOptionsCollection,
} from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { OptionBase } from '../../../types';

export type LayerType = 'base' | 'overlay';

export interface LayerOption extends OptionBase {
	type: LayerType;
}

export type RenderStylesCache = {
	optionsMap: { [value: string]: RenderStyleOptionsCollection };
	defaultsMap: { [value: string]: string | null };
};

export interface LayerConfigOptionsOnlineRasterXYZ {
	url?: LayerBitmapTileProps['url'];
	alpha?: LayerBitmapTileProps['alpha'];
	cacheSize?: LayerBitmapTileProps['cacheSize'];
	cacheDirBase?: 'internal' | LayerBitmapTileProps['cacheDirBase'];
	enabledZoomMin?: LayerBitmapTileProps['enabledZoomMin'];
	enabledZoomMax?: LayerBitmapTileProps['enabledZoomMax'];
	zoomMin?: LayerBitmapTileProps['zoomMin'];
	zoomMax?: LayerBitmapTileProps['zoomMax'];
}

export interface LayerConfigOptionsMapsforge {
	mapFile?: LayerMapsforgeProps['mapFile'];
	enabledZoomMin?: LayerMBTilesBitmapProps['enabledZoomMin'];
	enabledZoomMax?: LayerMBTilesBitmapProps['enabledZoomMax'];
	profile?: string;
}

export interface LayerConfigOptionsRasterMBtiles {
	mapFile?: LayerMBTilesBitmapProps['mapFile'];
	enabledZoomMin?: LayerMBTilesBitmapProps['enabledZoomMin'];
	enabledZoomMax?: LayerMBTilesBitmapProps['enabledZoomMax'];
}

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
	cacheDirBase?: 'internal' | LayerBitmapTileProps['cacheDirBase'];
}

export type LayerConfigOptionsAny =
	| LayerConfigOptionsOnlineRasterXYZ
	| LayerConfigOptionsMapsforge
	| LayerConfigOptionsRasterMBtiles
	| LayerConfigOptionsHillshading;

export type LayerConfig = {
	key: string;
	name: string;
	type: null | string; // 'online-raster-xyz' | 'mapsforge' | 'raster-MBtiles' | 'hillshading';
	visible: boolean;
	options: LayerConfigOptionsAny;
};

export type MapsforgeProfile = {
	key: string;
	name: string;
	theme: string; // It is AbsPath or built-in
	renderStyle: null | string;
	renderOverlays: string[];
	hasBuildings?: boolean;
	hasLabels?: boolean;
};

export type HgtDirPath =
	| LayerConfigOptionsHillshading['hgtDirPath']
	| MapContainerProps['hgtDirPath'];

export type MapsforgeGeneral = {
	textScale: number;
	lineScale: number;
	symbolScale: number;
};
