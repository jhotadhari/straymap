/**
 * External dependencies
 */
import { FC, useEffect, useRef } from 'react';
import { LayerBitmapTile, LayerBitmapTileProps } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { LayerConfig, LayerConfigOptionsOnlineRasterXYZ } from '../../types';
import { stringifyProp, resolveCacheDirBase } from '../../utils';

const LayerRendererOnlineRasterXYZ: FC<{
	layer: LayerConfig<LayerConfigOptionsOnlineRasterXYZ>;
	internalCacheDir?: string;
	onLayerCreated?: (layerKey: string, layerType: string) => void;
}> = ({ layer, internalCacheDir, onLayerCreated }) => {
	const opts = layer.options;

	const cacheDirBase = resolveCacheDirBase(opts.cacheDirBase, internalCacheDir);

	// Busy key: online-raster-xyz layers create synchronously on mount.
	// Defer via setTimeout(0) so the parent BaseMap's useEffect (which adds
	// the busy key) fires first — React runs child effects before parent effects.
	const didCreateRef = useRef(false);
	useEffect(() => {
		if (!didCreateRef.current) {
			didCreateRef.current = true;
			const timeoutId = setTimeout(() => onLayerCreated?.(layer.key, 'online-raster-xyz'), 0);
			return () => clearTimeout(timeoutId);
		}
	}, [onLayerCreated, layer.key]);

	// Separate cleanup: remove key on unmount as safety net.
	useEffect(() => {
		return () => onLayerCreated?.(layer.key, 'online-raster-xyz');
	}, [onLayerCreated, layer.key]);

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
