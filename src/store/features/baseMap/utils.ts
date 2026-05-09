/**
 * External dependencies
 */
import rnUuid from 'react-native-uuid';
import defaultsAssign from 'defaults';
import { get, invert, omit, pick } from 'lodash-es';
import { LayerHillshading } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import {
	LayerConfig,
	LayerConfigOptionsAny,
	LayerConfigOptionsHillshading,
	MapsforgeProfile,
} from './types';
import { stringifyProp } from '../../../utils';
import { defaults } from '../../../constants';
import { LayerType } from './types';
import { mapTypeOptions } from './components/controls/LayersControl';

export const getNewLayer = (): LayerConfig => ({
	key: rnUuid.v4(),
	name: '',
	visible: true,
	type: null,
	options: {},
});

export const getLayerType = (layer: LayerConfig): LayerType | null =>
	get(
		mapTypeOptions.find((opt) => opt.key === layer.type),
		'type',
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
