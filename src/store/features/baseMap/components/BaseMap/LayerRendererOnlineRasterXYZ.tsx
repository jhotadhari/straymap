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

const LayerRendererOnlineRasterXYZ: FC<{
	layer: LayerConfig<LayerConfigOptionsOnlineRasterXYZ>;
	internalCacheDir?: string;
}> = ({ layer, internalCacheDir }) => {
	const opts = layer.options;

	const cacheDirBase = resolveCacheDirBase(opts.cacheDirBase, internalCacheDir);

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
