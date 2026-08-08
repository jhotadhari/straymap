/**
 * External dependencies
 */
import { FC, memo, useCallback } from 'react';
import {
	LayerMBTilesBitmap,
	LayerMapsforgeResponse,
	LayerMBTilesBitmapResponse,
} from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { LayerConfig, LayerConfigOptionsRasterMBtiles } from '../../types';
import useLayerChangeCallback from './useLayerChangeCallback';
import { useMakeLayerBusy } from './useMakeLayerBusy';

const LayerRendererRasterMBtiles: FC<{
	layer: LayerConfig<LayerConfigOptionsRasterMBtiles>;
	onLayerChange: (
		key: string,
		response: LayerMapsforgeResponse | LayerMBTilesBitmapResponse
	) => void;
	onLayerCreated?: (layerKey: string, layerType: string) => void;
}> = ({ layer, onLayerChange, onLayerCreated }) => {
	const opts = layer.options;

	const hasSource = !!opts.mapFile;
	useMakeLayerBusy(layer.key, 'raster-MBtiles', layer.visible && hasSource);

	const handleCreateOrChange = useLayerChangeCallback(layer.key, onLayerChange);

	const handleCreate = useCallback(
		(response: LayerMBTilesBitmapResponse) => {
			handleCreateOrChange(response);
			onLayerCreated?.(layer.key, 'raster-MBtiles');
		},
		[
			handleCreateOrChange,
			onLayerCreated,
			layer.key,
		]
	);

	if (!layer.visible || !hasSource) return null;

	return (
		<LayerMBTilesBitmap
			key={layer.key}
			mapFile={opts.mapFile}
			enabledZoomMin={opts.enabledZoomMin}
			enabledZoomMax={opts.enabledZoomMax}
			onCreate={handleCreate}
			onChange={handleCreateOrChange}
		/>
	);
};

export default memo(LayerRendererRasterMBtiles);
