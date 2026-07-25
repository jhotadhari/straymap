/**
 * External dependencies
 */
import { FC } from 'react';
import { LayerBitmapTile, LayerBitmapTileProps } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { LayerConfig, LayerConfigOptionsOnlineRasterXYZ } from '../../types';
import { stringifyProp, resolveCacheDirBase } from '../../utils';
import { useDeferredLayerCreated } from './useDeferredLayerCreated';

const LayerRendererOnlineRasterXYZ: FC<{
	layer: LayerConfig<LayerConfigOptionsOnlineRasterXYZ>;
	internalCacheDir?: string;
	onLayerCreated?: (layerKey: string, layerType: string) => void;
}> = ({ layer, internalCacheDir, onLayerCreated }) => {
	const opts = layer.options;

	const cacheDirBase = resolveCacheDirBase(opts.cacheDirBase, internalCacheDir);

	useDeferredLayerCreated(layer.key, 'online-raster-xyz', onLayerCreated);

	return (
		<LayerBitmapTile
			key={layer.key}
			zoomMin={opts.zoomMin}
			zoomMax={opts.zoomMax}
			enabledZoomMin={opts.enabledZoomMin}
			enabledZoomMax={opts.enabledZoomMax}
			url={opts.url ?? ''}
			alpha={opts.alpha}
			cacheSize={opts.cacheSize}
			cacheDirChild={stringifyProp(opts.url || '')}
			cacheDirBase={cacheDirBase as LayerBitmapTileProps['cacheDirBase']}
		/>
	);
};

export default LayerRendererOnlineRasterXYZ;
