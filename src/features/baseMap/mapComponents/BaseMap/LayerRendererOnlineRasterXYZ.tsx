/**
 * External dependencies
 */
import { FC, memo, useCallback } from 'react';
import { LayerBitmapTile, LayerBitmapTileProps } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { LayerConfig, LayerConfigOptionsOnlineRasterXYZ } from '../../types';
import { stringifyProp, resolveCacheDirBase } from '../../utils';
import useLayerChangeCallback from './useLayerChangeCallback';
import { useMakeLayerBusy } from './useMakeLayerBusy';

const LayerRendererOnlineRasterXYZ: FC<{
	layer: LayerConfig<LayerConfigOptionsOnlineRasterXYZ>;
	internalCacheDir?: string;
	onLayerChange: (key: string, response: { uuid: string; nativeNodeHandle: number }) => void;
	onLayerCreated?: (layerKey: string, layerType: string) => void;
}> = ({ layer, internalCacheDir, onLayerChange, onLayerCreated }) => {
	const opts = layer.options;

	const hasSource = !!opts.url;
	useMakeLayerBusy(layer.key, 'online-raster-xyz', layer.visible && hasSource);

	const cacheDirBase = resolveCacheDirBase(opts.cacheDirBase, internalCacheDir);

	const handleCreateOrChange = useLayerChangeCallback(layer.key, onLayerChange);

	const handleCreate = useCallback(
		(response: { uuid: string; nativeNodeHandle: number }) => {
			handleCreateOrChange(response);
			onLayerCreated?.(layer.key, 'online-raster-xyz');
		},
		[
			handleCreateOrChange,
			onLayerCreated,
			layer.key,
		]
	);

	if (!layer.visible || !hasSource) return null;

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
			onCreate={handleCreate}
			onChange={handleCreateOrChange}
		/>
	);
};

export default memo(LayerRendererOnlineRasterXYZ);
