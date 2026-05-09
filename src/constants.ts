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

export const LINKING_ERROR =
	"The package doesn't seem to be linked. Make sure: \n\n" +
	'- You rebuilt the app after installing the package\n' +
	'- You are not using Expo Go\n';

export const modalWidthFactor = 0.8;

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
