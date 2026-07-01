/**
 * External dependencies
 */
import { MutableRefObject, useCallback, useEffect, useRef, useState } from 'react';
import { NativeSyntheticEvent } from 'react-native';
import DefaultPreference from 'react-native-default-preference';
import { MapEventResponse } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import type { InitialPosition } from '../types';
import { logError } from '../lib/utils';

const defaultCenter = [
	-70.239,
	-10.65,
];

const useInitialCenter = (currentMapEventRef: MutableRefObject<MapEventResponse | null>) => {
	const [initialized, setInitialized] = useState(false);

	const initialPositionRef = useRef<undefined | InitialPosition>(undefined);

	useEffect(() => {
		DefaultPreference.get('initialPosition')
			.then((newInitialPositionStr) => {
				if (newInitialPositionStr) {
					const newInitialPosition = JSON.parse(newInitialPositionStr);
					// If center was saved in old type, drop it.
					if (newInitialPosition?.center && !Array.isArray(newInitialPosition?.center)) {
						newInitialPosition.center = defaultCenter;
					}
					initialPositionRef.current = newInitialPosition;
				} else {
					initialPositionRef.current = {
						center: defaultCenter,
						zoomLevel: 5,
					};
				}
				setInitialized(true);
			})
			.catch((err) => logError('useInitialCenter', err));
	}, []);

	const getCurrentPosition = useCallback(
		(event?: NativeSyntheticEvent<MapEventResponse>) => {
			// MapContainer's onPause is a Fabric native-view event prop, so React invokes it with a
			// NativeSyntheticEvent wrapper (event.nativeEvent), not a bare MapEventResponse -- unlike
			// e.g. useMap()'s getPosition(), which resolves a plain object. When called directly from
			// the setInterval below (no event), this is undefined and we fall through to the ref.
			const response = event?.nativeEvent;
			let newPosition: undefined | InitialPosition = undefined;
			if (response && response?.center && response?.zoomLevel) {
				newPosition = {
					center: response.center,
					zoomLevel: response.zoomLevel,
				};
			} else if (
				currentMapEventRef?.current?.center &&
				currentMapEventRef?.current?.zoomLevel
			) {
				newPosition = {
					center: currentMapEventRef.current.center,
					zoomLevel: currentMapEventRef.current.zoomLevel,
				};
			} else if (
				initialPositionRef?.current?.center &&
				initialPositionRef?.current?.zoomLevel
			) {
				newPosition = {
					center: initialPositionRef.current.center,
					zoomLevel: initialPositionRef.current.zoomLevel,
				};
			}
			return newPosition;
		},
		[currentMapEventRef]
	);

	const saveCurrentPositionToInitial = useCallback(
		(event?: NativeSyntheticEvent<MapEventResponse>) => {
			const newPosition = getCurrentPosition(event);
			if (newPosition) {
				DefaultPreference.set('initialPosition', JSON.stringify(newPosition)).catch((err) =>
					logError('useInitialCenter', err)
				);
			}
		},
		[getCurrentPosition]
	);

	// Save position every x seconds.
	const intervalIdRef = useRef<null | NodeJS.Timeout>(null);
	useEffect(() => {
		if (initialized) {
			intervalIdRef.current = setInterval(saveCurrentPositionToInitial, 1000 * 30);
		}
		return () => {
			if (intervalIdRef.current) {
				clearInterval(intervalIdRef.current);
			}
		};
	}, [initialized, saveCurrentPositionToInitial]);

	return {
		initialized,
		initialPositionRef,
		saveCurrentPositionToInitial,
	};
};

export default useInitialCenter;
