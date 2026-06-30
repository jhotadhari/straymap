/**
 * External dependencies
 */
import { FC } from 'react';
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
}> = ({ layer, onLayerChange }) => {
	const opts = layer.options;

	const handleCreateOrChange = useLayerChangeCallback(layer.key, onLayerChange);

	return (
		<LayerMBTilesBitmap
			key={layer.key}
			mapFile={opts.mapFile}
			enabledZoomMin={opts.enabledZoomMin}
			enabledZoomMax={opts.enabledZoomMax}
			onCreate={handleCreateOrChange}
			onChange={handleCreateOrChange}
		/>
	);
};

export default LayerRendererRasterMBtiles;
