/**
 * External dependencies
 */
import { useContext, useEffect, useRef } from 'react';
import { MapEventResponse } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { MapContext } from '../../../Context';
import { useAppSelector } from '../../../store/hooks';
import { selectMapUpdateInterval } from '../../general/selectors';

/**
 * Polls `currentMapEventRef` at the configured map update interval.
 *
 * The callback receives the latest MapEventResponse (or null if none yet).
 * Uses a callback-ref to avoid re-registering the interval when the callback
 * identity changes — only `mapUpdateInterval` changes restart the timer.
 */
export function useMapEventInterval(callback: (event: MapEventResponse | null) => void): void {
	const mapUpdateInterval = useAppSelector(selectMapUpdateInterval);
	const { currentMapEventRef } = useContext(MapContext);

	const callbackRef = useRef(callback);
	callbackRef.current = callback;

	useEffect(() => {
		const id = setInterval(() => {
			callbackRef.current(currentMapEventRef?.current ?? null);
		}, mapUpdateInterval);
		return () => clearInterval(id);
	}, [mapUpdateInterval, currentMapEventRef]);
}
