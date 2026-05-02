/**
 * External dependencies
 */
import { LayerHillshading } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import packageJson from '../package.json';

export const LINKING_ERROR =
	'The package doesn\'t seem to be linked. Make sure: \n\n' +
	'- You rebuilt the app after installing the package\n' +
	'- You are not using Expo Go\n';

export const modalWidthFactor = 0.8;

export const defaults = {
	uiState: {
		mapLayersExpanded: false,
		mapsforgeProfilesExpanded: false,
		cacheManagerExpanded: false,
	},
	layerConfigOptions: {
		['online-raster-xyz']: {
			alpha: 1,
			cacheSize: 0,
			cacheDirBase: 'internal',
			zoomMin: 1,
			zoomMax: 20,
			enabledZoomMin: 1,
			enabledZoomMax: 20,
		},
		['mapsforge']: {
			enabledZoomMin: 1,
			enabledZoomMax: 20,
			profile: 'default',
		},
		['raster-MBtiles']: {
			enabledZoomMin: 1,
			enabledZoomMax: 20,
		},
		['hillshading']: {
			cacheSize: 64,
			cacheDirBase: 'internal',
			zoomMin: 1,
			zoomMax: 20,
			enabledZoomMin: 1,
			enabledZoomMax: 20,
			magnitude: 90,
			shadingAlgorithm: Object.values( LayerHillshading.shadingAlgorithms )[0],
			shadingAlgorithmOptions: LayerHillshading.shadingAlgorithmOptionsDefaults,
		},
	},
	updaterSettings: {
		installedVersion: packageJson.version,
	},
};