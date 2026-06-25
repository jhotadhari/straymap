/**
 * External dependencies
 */
import { MutableRefObject, useCallback, useEffect, useRef, useState } from 'react';
import DefaultPreference from 'react-native-default-preference';
import { MapEventResponse } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import type { InitialPosition } from '../types';

const useInitialCenter = (currentMapEventRef: MutableRefObject<MapEventResponse | null>) => {
	const [initialized, setInitialized] = useState(false);

	const initialPositionRef = useRef<undefined | InitialPosition>(undefined);

	useEffect(() => {
		DefaultPreference.get('initialPosition')
			.then((newInitialPosition) => {
				if (newInitialPosition) {
					initialPositionRef.current = JSON.parse(newInitialPosition);
				} else {
					initialPositionRef.current = {
						center: [
							-70.239,
							-10.65,
						],
						zoomLevel: 5,
					};
				}
				setInitialized(true);
			})
			.catch((err) => 'ERROR' + console.log(err));
	}, []);

	const getCurrentPosition = useCallback((response?: MapEventResponse) => {
		let newPosition: undefined | InitialPosition = undefined;
		if (response && response?.center && response?.zoomLevel) {
			newPosition = {
				center: response.center,
				zoomLevel: response.zoomLevel,
			};
		} else if (currentMapEventRef?.current?.center && currentMapEventRef?.current?.zoomLevel) {
			newPosition = {
				center: currentMapEventRef.current.center,
				zoomLevel: currentMapEventRef.current.zoomLevel,
			};
		} else if (initialPositionRef?.current?.center && initialPositionRef?.current?.zoomLevel) {
			newPosition = {
				center: initialPositionRef.current.center,
				zoomLevel: initialPositionRef.current.zoomLevel,
			};
		}
		return newPosition;
	}, []);

	const saveCurrentPositionToInitial = useCallback(
		(response?: MapEventResponse) => {
			const newPosition = getCurrentPosition(response);
			if (newPosition) {
				DefaultPreference.set('initialPosition', JSON.stringify(newPosition)).catch(
					(err) => 'ERROR' + console.log(err)
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
