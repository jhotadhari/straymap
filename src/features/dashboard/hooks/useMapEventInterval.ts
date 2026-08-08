/**
 * External dependencies
 */
import { useContext } from 'react';
import {
	MapEventResponse,
	useMapEventInterval as useLibMapEventInterval,
} from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { MapContext } from '../../../Context';
import { useAppSelector } from '../../../store/hooks';
import { selectMapUpdateInterval } from '../../general/selectors';

/**
 * Polls `currentMapEventRef` at the configured map update interval.
 *
 * Convenience wrapper around the library's {@link useMapEventInterval} that
 * reads the event ref and interval from the app's Redux store and MapContext
 * automatically.
 *
 * The callback receives the latest MapEventResponse (or null if none yet).
 * Uses a callback-ref to avoid re-registering the interval when the callback
 * identity changes — only `mapUpdateInterval` changes restart the timer.
 */
export function useMapEventInterval(callback: (event: MapEventResponse | null) => void): void {
	const mapUpdateInterval = useAppSelector(selectMapUpdateInterval);
	const { currentMapEventRef } = useContext(MapContext);

	useLibMapEventInterval(currentMapEventRef, mapUpdateInterval, callback);
}
