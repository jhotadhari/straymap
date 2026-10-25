/**
 * External dependencies
 */
import { useCallback, useEffect, useMemo } from 'react';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { selectIsActive } from '../../gnss/selectors';
import { setGnssPosition, GnssPositionData } from '../../gnss/slice';
import {
	selectIsRecording,
	selectMinDistance,
	selectMinTime,
	selectMinPrecision,
} from '../selectors';
import { writeGnssPosition } from '../slice';

/**
 * Relaxed filter for plain GNSS activation (no recording). Recording
 * uses the strict track-recording filter instead — denser updates are a
 * superset, so the recording filter wins when both are active.
 */
const GNSS_IDLE_FILTER = {
	minDistanceMeters: 0,
	minTimeSec: 1,
	minAccuracyMeters: 100,
	provider: 'satellite' as const,
	altitudeSource: 'dem-preferred' as const,
};

/**
 * Derives the native {@code gnssFilter} prop and the
 * {@code onGnssPosition} callback for {@code MapContainer}.
 *
 * The filter is set while GNSS is active or track recording is running,
 * and {@code undefined} otherwise — the native {@code LocationListener}
 * is unregistered by the view manager when the filter is removed.
 *
 * Every native position feeds the gnss slice's live position; while
 * recording it is additionally forwarded via {@code writeGnssPosition}
 * for the track-recording listener to persist.
 *
 * @returns {{ gnssFilter, handleGnssPosition }}
 */
export function useGnssSetup() {
	const dispatch = useAppDispatch();
	const isRecording = useAppSelector(selectIsRecording);
	const gnssIsActive = useAppSelector(selectIsActive);
	const minDistance = useAppSelector(selectMinDistance);
	const minTime = useAppSelector(selectMinTime);
	const minPrecision = useAppSelector(selectMinPrecision);

	const gnssFilter = useMemo(() => {
		if (isRecording) {
			return {
				minDistanceMeters: minDistance,
				minTimeSec: minTime,
				minAccuracyMeters: minPrecision,
				provider: 'satellite' as const,
				altitudeSource: 'dem-preferred' as const,
			};
		}
		if (gnssIsActive) {
			return GNSS_IDLE_FILTER;
		}
		return undefined;
	}, [
		isRecording,
		gnssIsActive,
		minDistance,
		minTime,
		minPrecision,
	]);

	// Callback from native onGnssPosition — feeds the gnss slice's live
	// position, and (while recording) the track-recording listener.
	const handleGnssPosition = useCallback(
		(event: { nativeEvent: GnssPositionData }) => {
			dispatch(setGnssPosition(event.nativeEvent));
			if (isRecording) {
				dispatch(
					writeGnssPosition({
						lng: event.nativeEvent.lng,
						lat: event.nativeEvent.lat,
						altitude: event.nativeEvent.altitude,
					})
				);
			}
		},
		[dispatch, isRecording]
	);

	// Clear the stale position whenever the listener is unregistered
	// (covers e.g. stopping the recording while GNSS is off).
	useEffect(() => {
		if (!gnssFilter) {
			dispatch(setGnssPosition(null));
		}
	}, [gnssFilter, dispatch]);

	return useMemo(() => ({ gnssFilter, handleGnssPosition }), [gnssFilter, handleGnssPosition]);
}
