/**
 * External dependencies
 */
import { FC } from 'react';
import { LayerHillshading, LayerHillshadingProps } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { LayerConfig, LayerConfigOptionsHillshading } from '../../types';
import {
	getHillshadingCacheDirChild,
	getShadingAlgorithmOptions,
	resolveCacheDirBase,
	SHADING_ALGORITHM,
} from '../../utils';

const LayerRendererHillshading: FC<{
	layer: LayerConfig<LayerConfigOptionsHillshading>;
	internalCacheDir?: string;
}> = ({ layer, internalCacheDir }) => {
	const opts = layer.options;

	const cacheDirBase = resolveCacheDirBase(opts.cacheDirBase, internalCacheDir);

	return (
		<LayerHillshading
			key={layer.key}
			hgtDirPath={opts.hgtDirPath}
			zoomMin={opts.zoomMin}
			zoomMax={opts.zoomMax}
			enabledZoomMin={opts.enabledZoomMin}
			enabledZoomMax={opts.enabledZoomMax}
			magnitude={opts.magnitude}
			cacheSize={opts.cacheSize}
			cacheDirChild={getHillshadingCacheDirChild(opts)}
			cacheDirBase={cacheDirBase as LayerHillshadingProps['cacheDirBase']}
			shadingAlgorithm={SHADING_ALGORITHM}
			shadingAlgorithmOptions={getShadingAlgorithmOptions(opts)}
		/>
	);
};

export default LayerRendererHillshading;
