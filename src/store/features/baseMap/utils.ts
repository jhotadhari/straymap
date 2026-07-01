/**
 * External dependencies
 */
import rnUuid from 'react-native-uuid';
import defaultsAssign from 'defaults';
import { get, invert, omit, pick } from 'lodash-es';
import { LayerHillshading } from 'react-native-mapsforge-vtm';
import { ActionCreatorWithPayload } from '@reduxjs/toolkit';
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
import { defaults } from '../../../constants';
import { LayerKind } from './types';
import { mapTypeOptions } from './components/controls/layers/LayersControl';
import { AppThunk, RootState } from '../../store';

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

export const getSetterThunkWithGetter = <T>(
	selector: (state: RootState) => T,
	setter: ActionCreatorWithPayload<T, any>
) => {
	return (newValueOrGetter: T | ((currentValue: T) => T)): AppThunk => {
		return (dispatch, getState) => {
			const currentValue = selector(getState());
			const newValue: T =
				newValueOrGetter instanceof Function
					? newValueOrGetter(currentValue)
					: newValueOrGetter;
			dispatch(setter(newValue));
		};
	};
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
	const shadingAlgoKey = get(
		invert(LayerHillshading.shadingAlgorithms),
		options?.shadingAlgorithm || '',
		''
	);
	const shadingAlgorithmsOptionKeys = get(
		LayerHillshading.shadingAlgorithmsOptionKeys,
		shadingAlgoKey,
		[]
	) as string[];
	return (
		'shading' +
		stringifyProp(
			omit(
				{
					...options,
					shadingAlgorithmOptions: pick(
						defaultsAssign(
							options?.shadingAlgorithmOptions || {},
							defaults.layerConfigOptions.hillshading.shadingAlgorithmOptions
						),
						shadingAlgorithmsOptionKeys
					),
				},
				[
					'enabledZoomMin',
					'enabledZoomMax',
					'zoomMin',
					'zoomMax',
					'cacheSize',
					'cacheDirBase',
					'hgtDirPath',
				]
			)
		)
	);
};
