/**
 * External dependencies
 */
import { memo, FC } from 'react';
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
import { useAppSelector } from '../../../../store/hooks';
import { selectHgtDirPath } from '../../selectors';
import { useDeferredLayerCreated } from './useDeferredLayerCreated';
import { useMakeLayerBusy } from './useMakeLayerBusy';

const LayerRendererHillshading: FC<{
	layer: LayerConfig<LayerConfigOptionsHillshading>;
	internalCacheDir?: string;
	onLayerCreated?: (layerKey: string, layerType: string) => void;
}> = ({ layer, internalCacheDir, onLayerCreated }) => {
	const opts = layer.options;

	const cacheDirBase = resolveCacheDirBase(opts.cacheDirBase, internalCacheDir);

	const appHgtDirPath = useAppSelector(selectHgtDirPath);

	const hasSource = !!(opts?.hgtDirPath ?? appHgtDirPath);
	useMakeLayerBusy(layer.key, 'hillshading', layer.visible && hasSource);

	useDeferredLayerCreated(layer.key, 'hillshading', onLayerCreated);

	return layer.visible && hasSource ? (
		<LayerHillshading
			key={layer.key}
			hgtDirPath={opts?.hgtDirPath ?? appHgtDirPath}
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
	) : undefined;
};

export default memo(LayerRendererHillshading);
