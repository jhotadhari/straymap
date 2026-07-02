/**
 * Internal dependencies
 */
import {
	LayerConfigOptionsHillshading,
	LayerConfigOptionsMapsforge,
	LayerConfigOptionsOnlineRasterXYZ,
	LayerConfigOptionsRasterMBtiles,
} from './types';

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
			// Algorithm locked to CLASY_ADAPTIVE.
			// Only user-adjustable shading options; the rest use library defaults.
			maxSlope: 80,
			minSlope: 0,
			asymmetryFactor: 0.5,
		} as LayerConfigOptionsHillshading,
	},
};
