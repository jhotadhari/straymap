/**
 * SceneBusyBridge — wires the map's layer-scene busyness into the global
 * LoadingBar via the Redux busyKeys.
 *
 * Must be rendered inside <MapContainer> so useSceneBusy() can read the map's
 * MapHandleContext. Renders null — it only bridges state.
 */

import { useEffect } from 'react';
import { useSceneBusy } from 'react-native-mapsforge-vtm';
import { useAppDispatch } from '../store/hooks';
import { addBusyKey, removeBusyKey } from '../features/ui/slice';

const BUSY_KEY = 'map:sync';

const SceneBusyBridge = () => {
	const isSceneBusy = useSceneBusy();
	const dispatch = useAppDispatch();

	useEffect(() => {
		if (isSceneBusy) {
			dispatch(addBusyKey(BUSY_KEY));
		} else {
			dispatch(removeBusyKey(BUSY_KEY));
		}
	}, [isSceneBusy, dispatch]);

	return null;
};

export default SceneBusyBridge;
