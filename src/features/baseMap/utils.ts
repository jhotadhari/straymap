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
import { getPlaceholderLabel as getPlaceholderLabel_mapsforge } from './components/controls/layers/LayerControlMapsforge';
import { getPlaceholderLabel as getPlaceholderLabel_onlineRasterXyz } from './components/controls/layers/LayerControlOnlineRasterXYZ';
import { getPlaceholderLabel as getPlaceholderLabel_rasterMbtiles } from './components/controls/layers/LayerControlRasterMBTiles';

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

// Derive a human-readable label from a DEM directory path.
// "/storage/emulated/0/Android/media/.../dem" → "media"
// "/storage/emulated/0/Android/data/.../files/dem" → "data"
// "/storage/9016-4EF8/Android/media/.../dem" → "sdcard media"
// "/storage/9016-4EF8/Android/data/.../files/dem" → "sdcard data"
export const labelFromDemPath = (path: string): string => {
	if (path.startsWith('content://')) return 'custom';
	const isSdCard = !path.includes('emulated');
	const isMedia = path.includes('/Android/media/');
	const parts: string[] = [];
	if (isSdCard) parts.push('sdcard');
	parts.push(isMedia ? 'media' : 'data');
	return parts.join(' ');
};

// Check whether a layer has a configured source.
// Used to show/hide warning icons and guard renderer visibility.
export const hasLayerSource = (layer?: LayerConfig, appHgtDirPath?: string): boolean => {
	return !!getLayerLabel(layer, { appHgtDirPath })?.key;
};

// Return an i18next-compatible `{ key, params }` object for a layer's fallback label.
// The key may be a translation key (for hillshading) or a raw string (for other types —
// a raw string passed to `t()` renders as-is).
// Returns `undefined` when no source is configured.
export const getLayerLabel = (
	layer?: LayerConfig,
	props?: { fallback?: string; appHgtDirPath?: string }
): undefined | { key: string; params?: Record<string, string> } => {
	switch (layer?.type) {
		case 'hillshading': {
			const perLayerPath = (layer.options as LayerConfigOptionsHillshading)?.hgtDirPath;
			const path = perLayerPath ?? props?.appHgtDirPath;
			if (!path) return undefined;
			const label = labelFromDemPath(path);
			return {
				key: perLayerPath
					? 'baseMap.demLabel.shading'
					: 'baseMap.demLabel.shadingGlobal',
				params: { label },
			};
		}
		case 'mapsforge': {
			const raw = getPlaceholderLabel_mapsforge(layer);
			return raw && raw.length > 0 ? { key: raw } : undefined;
		}
		case 'online-raster-xyz': {
			const raw = getPlaceholderLabel_onlineRasterXyz(layer);
			return raw && raw.length > 0 ? { key: raw } : undefined;
		}
		case 'raster-MBtiles': {
			const raw = getPlaceholderLabel_rasterMbtiles(layer);
			return raw && raw.length > 0 ? { key: raw } : undefined;
		}
	}
	if (props?.fallback) {
		return { key: props.fallback };
	}
	return undefined;
};

export const makeLayerBusyKey = (layerType: string, layerKey: string): string =>
	`map:base-layer:${layerType}:${layerKey}`;
