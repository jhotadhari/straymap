/**
 * External dependencies
 */
import rnUuid from 'react-native-uuid';
import defaultsAssign from 'defaults';
import { get, omit } from 'lodash-es';
import { LayerHillshading, ShadingAlgorithmOptions } from 'react-native-mapsforge-vtm';
import slugify from 'slugify';

/**
 * Internal dependencies
 */
import {
	LayerConfig,
	LayerConfigOptionsAny,
	LayerConfigOptionsHillshading,
	MapsforgeProfile,
} from './types';
import { defaults } from './defaults';
import { LayerKind } from './types';
import { mapTypeOptions } from './components/controls/layers/LayersControl';

export const stringifyProp = (prop: any, deli?: string): string => {
	deli = deli || '_';
	switch (true) {
		case 'string' === typeof prop:
			return slugify(prop + '', { strict: true, replacement: '_' });
		case 'number' === typeof prop:
			return [
				prop < 0 ? 'm' : '',
				slugify((prop + '').replace('.', 'd'), { strict: true, replacement: '_' }),
			].join('');
		case 'object' === typeof prop:
			return Object.keys(prop)
				.sort()
				.reduce((acc: string, optKey: string) => {
					return acc + deli + stringifyProp(get(prop, optKey));
				}, '');
		case 'boolean' === typeof prop:
			return true === prop ? '1' : '0';
		default:
			return '';
	}
};

export const getNewLayer = (): LayerConfig => ({
	key: rnUuid.v4(),
	name: '',
	visible: true,
	type: null,
	options: {},
});

export const getLayerKind = (layer: LayerConfig): LayerKind | null =>
	get(
		mapTypeOptions.find((opt) => opt.key === layer.type),
		'kind',
		null
	);

export const getNewProfile = (): MapsforgeProfile => ({
	key: rnUuid.v4(),
	name: '',
	theme: 'DEFAULT',
	renderStyle: null,
	renderOverlays: [],
	hasBuildings: true,
	hasLabels: true,
});

export const fillLayerConfigOptionsWithDefaults = (
	type: null | string,
	options: LayerConfigOptionsAny
): LayerConfigOptionsAny => {
	return type
		? (defaultsAssign(
				options as Record<string, unknown>,
				get(defaults.layerConfigOptions, type, {})
			) as LayerConfigOptionsAny)
		: options;
};

/**
 * Resolves the cache directory base path for online-raster-xyz and hillshading layers.
 *
 * When `cacheDirBase` is `'internal'`, the app's internal cache directory is used.
 * When it is `/`, the native side falls back to the Java
 * `getReactApplicationContext().getCacheDir()`. Any other value is used as-is.
 */
export const resolveCacheDirBase = (
	cacheDirBase: 'internal' | string | undefined,
	internalCacheDir: string | undefined
): string => {
	if (cacheDirBase === 'internal') {
		return internalCacheDir ?? '/';
	}
	return cacheDirBase ?? '/';
};

export const getHillshadingCacheDirChild = (options: LayerConfigOptionsHillshading): string => {
	return (
		'shading' +
		stringifyProp(
			omit(options, [
				'enabledZoomMin',
				'enabledZoomMax',
				'zoomMin',
				'zoomMax',
				'cacheSize',
				'cacheDirBase',
				'hgtDirPath',
			])
		)
	);
};

/** Algorithm locked for hillshading — the best quality/performance trade-off. */
export const SHADING_ALGORITHM = LayerHillshading.shadingAlgorithms.CLASY_ADAPTIVE;

/**
 * Builds the nested ShadingAlgorithmOptions object expected by LayerHillshading.
 * Only passes user-configurable values; the library fills its own defaults for the rest.
 */
export const getShadingAlgorithmOptions = (
	options: LayerConfigOptionsHillshading
): ShadingAlgorithmOptions => {
	return {
		maxSlope: options.maxSlope,
		minSlope: options.minSlope,
		asymmetryFactor: options.asymmetryFactor,
	};
};
