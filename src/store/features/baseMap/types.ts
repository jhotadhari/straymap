/**
 * External dependencies
 */
import {
	LayerMBTilesBitmapProps,
	LayerBitmapTileProps,
	LayerMapsforgeProps,
	LayerHillshadingProps,
	RenderStyleOption,
} from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { OptionBase } from '../../../types';

export type LayerKind = 'base' | 'overlay';

export interface LayerOption extends OptionBase {
	kind: LayerKind;
}

export type LayerInfo = {
	attribution?: string | null;
	description?: string | null;
	comment?: string | null;
	createdBy?: string | null;
};

export type LayerInfos = { [value: string]: LayerInfo };

export type RenderStylesCache = {
	optionsMap: { [value: string]: RenderStyleOption[] };
	defaultsMap: { [value: string]: string | undefined };
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
	magnitude?: LayerHillshadingProps['magnitude'];
	cacheSize?: LayerHillshadingProps['cacheSize'];
	cacheDirBase?: 'internal' | LayerBitmapTileProps['cacheDirBase'];
	// Algorithm is locked to CLASY_ADAPTIVE.
	// Only user-adjustable shading options; the rest use library defaults.
	maxSlope?: number;
	minSlope?: number;
	asymmetryFactor?: number;
}

export type LayerConfigOptionsAny =
	| LayerConfigOptionsOnlineRasterXYZ
	| LayerConfigOptionsMapsforge
	| LayerConfigOptionsRasterMBtiles
	| LayerConfigOptionsHillshading;

export type LayerConfig<OptionsType = LayerConfigOptionsAny> = {
	key: string;
	name: string;
	type: null | string; // 'online-raster-xyz' | 'mapsforge' | 'raster-MBtiles' | 'hillshading';
	visible: boolean;
	options: OptionsType;
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

export type HgtDirPath = LayerHillshadingProps['hgtDirPath'];

export type MapsforgeGeneral = {
	textScale: number;
	lineScale: number;
	symbolScale: number;
};
