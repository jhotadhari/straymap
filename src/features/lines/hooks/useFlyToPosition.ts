/**
 * External dependencies
 */
import { useCallback, useContext } from 'react';
import { useMap } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { useAppDispatch } from '../../../store/hooks';
import { setUiItemKeys } from '../../ui/slice';
import { AppContext } from '../../../Context';

/**
 * Flies the map to an explicit center, closing fullscreen pages first so
 * the re-centered map is visible. Zooms to 10 when the current zoom is
 * below 10.
 */
const useFlyToPosition = () => {
	const dispatch = useAppDispatch();
	const { mapViewNativeNodeHandle } = useContext(AppContext);
	const { flyTo, getPosition } = useMap(mapViewNativeNodeHandle);

	const flyToPosition = useCallback(
		async (center: [number, number]) => {
			// Close fullscreen pages so the re-centered map is visible.
			dispatch(setUiItemKeys([]));

			let zoom = 0;
			try {
				const pos = await getPosition();
				zoom = pos?.zoomLevel ?? 0;
			} catch {
				// Zoom unknown — fall back to just centering.
			}

			if (zoom < 10) {
				await flyTo({ center, zoomLevel: 10 });
			} else {
				await flyTo({ center });
			}
		},
		[
			dispatch,
			getPosition,
			flyTo,
		]
	);

	return flyToPosition;
};

export default useFlyToPosition;
