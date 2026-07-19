/**
 * External dependencies
 */
import { FC, useCallback, useEffect } from 'react';
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

const LayerRendererRasterMBtiles: FC<{
	layer: LayerConfig<LayerConfigOptionsRasterMBtiles>;
	onLayerChange: (
		key: string,
		response: LayerMapsforgeResponse | LayerMBTilesBitmapResponse
	) => void;
	onLayerCreated?: (layerKey: string, layerType: string) => void;
}> = ({ layer, onLayerChange, onLayerCreated }) => {
	const opts = layer.options;

	const handleCreateOrChange = useLayerChangeCallback(layer.key, onLayerChange);

	// Wrap onCreate to also signal the busy key. onChange does not need this —
	// only the initial creation indicates the layer is ready.
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

	// Safety net: remove busy key on unmount in case the layer was removed
	// before onCreate fired (e.g. user toggled visibility during init).
	useEffect(() => {
		return () => onLayerCreated?.(layer.key, 'raster-MBtiles');
	}, [onLayerCreated, layer.key]);

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

export default LayerRendererRasterMBtiles;
