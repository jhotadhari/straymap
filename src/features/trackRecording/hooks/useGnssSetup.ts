/**
 * External dependencies
 */
import { useCallback, useMemo } from 'react';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
	selectIsRecording,
	selectMinDistance,
	selectMinTime,
	selectMinPrecision,
} from '../selectors';
import { writeGnssPosition } from '../slice';

/**
 * Derives the native {@code gnssFilter} prop and the
 * {@code onGnssPosition} callback for {@code MapContainer}.
 *
 * The filter is derived from Redux track-recording settings and is
 * {@code undefined} when not recording — the native
 * {@code LocationListener} is unregistered by the view manager.
 *
 * @returns {{ gnssFilter, handleGnssPosition }}
 */
export function useGnssSetup() {
	const dispatch = useAppDispatch();
	const isRecording = useAppSelector(selectIsRecording);
	const minDistance = useAppSelector(selectMinDistance);
	const minTime = useAppSelector(selectMinTime);
	const minPrecision = useAppSelector(selectMinPrecision);

	const gnssFilter = useMemo(() => {
		if (!isRecording) return undefined;
		return {
			minDistanceMeters: minDistance,
			minTimeSec: minTime,
			minAccuracyMeters: minPrecision,
			provider: 'satellite' as const,
			altitudeSource: 'dem-preferred' as const,
		};
	}, [
		isRecording,
		minDistance,
		minTime,
		minPrecision,
	]);

	// Callback from native onGnssPosition — dispatches the pre-filtered,
	// altitude-resolved position for the track-recording listener to write.
	const handleGnssPosition = useCallback(
		(event: { nativeEvent: { lng: number; lat: number; altitude: number | null } }) => {
			dispatch(writeGnssPosition(event.nativeEvent));
		},
		[dispatch]
	);

	return { gnssFilter, handleGnssPosition };
}
