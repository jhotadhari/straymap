/**
 * External dependencies
 */
import { useCallback } from 'react';
import { LayerMapsforgeResponse, LayerMBTilesBitmapResponse } from 'react-native-mapsforge-vtm';

/**
 * Creates a stable callback that delegates to `onLayerChange` with a pre-bound layer key.
 * Used by layer renderers that receive `onCreate`/`onChange` props from the VTM library.
 */
const useLayerChangeCallback = (
	key: string,
	onLayerChange: (
		key: string,
		response: LayerMapsforgeResponse | LayerMBTilesBitmapResponse
	) => void
) =>
	useCallback(
		(response: LayerMapsforgeResponse | LayerMBTilesBitmapResponse) =>
			onLayerChange(key, response),
		[onLayerChange, key]
	);

export default useLayerChangeCallback;
