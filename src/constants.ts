/**
 * External dependencies
 */
import { LayerHillshading } from 'react-native-mapsforge-vtm';
import {
	LayerConfigOptionsHillshading,
	LayerConfigOptionsMapsforge,
	LayerConfigOptionsOnlineRasterXYZ,
	LayerConfigOptionsRasterMBtiles,
} from './store/features/baseMap/types';

export const modalWidthFactor = 0.8;

/**
 * Icon sizes used across the app.
 * DRAWER_ICON_SIZE (25) is the standard for list rows, table rows,
 * drawer handles, and most interactive controls.
 * DASHBOARD_ICON_SIZE (24) is slightly smaller for the dashboard
 * control panel where space is tighter.
 */
export const DRAWER_ICON_SIZE = 25;
export const DASHBOARD_ICON_SIZE = 24;

export const defaults = {
	layerConfigOptions: {
		['online-raster-xyz']: {
			alpha: 1,
			cacheSize: 100,
			cacheDirBase: 'internal',
			zoomMin: 1,
			zoomMax: 20,
			enabledZoomMin: 1,
			enabledZoomMax: 20,
		} as LayerConfigOptionsOnlineRasterXYZ,
		['mapsforge']: {
			enabledZoomMin: 1,
			enabledZoomMax: 20,
			profile: 'default', // will use the first one.
		} as LayerConfigOptionsMapsforge,
		['raster-MBtiles']: {
			enabledZoomMin: 1,
			enabledZoomMax: 20,
		} as LayerConfigOptionsRasterMBtiles,
		['hillshading']: {
			cacheSize: 100,
			cacheDirBase: 'internal',
			zoomMin: 1,
			zoomMax: 20,
			enabledZoomMin: 1,
			enabledZoomMax: 20,
			magnitude: 90,
			shadingAlgorithm: Object.values(LayerHillshading.shadingAlgorithms)[0],
			shadingAlgorithmOptions: LayerHillshading.shadingAlgorithmOptionsDefaults,
		} as LayerConfigOptionsHillshading,
	},
};
