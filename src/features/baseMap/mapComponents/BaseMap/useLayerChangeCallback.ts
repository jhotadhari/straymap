/**
 * External dependencies
 */
import { useCallback } from 'react';
import { LayerMapsforgeResponse, LayerMBTilesBitmapResponse } from 'react-native-mapsforge-vtm';

type LayerResponse =
	| LayerMapsforgeResponse
	| LayerMBTilesBitmapResponse
	| { uuid: string; nativeNodeHandle: number };

/**
 * Creates a stable callback that delegates to `onLayerChange` with a pre-bound layer key.
 * Used by layer renderers that receive `onCreate`/`onChange` props from the VTM library.
 */
const useLayerChangeCallback = (
	key: string,
	onLayerChange: (key: string, response: LayerResponse) => void
) => useCallback((response: LayerResponse) => onLayerChange(key, response), [onLayerChange, key]);

export default useLayerChangeCallback;
