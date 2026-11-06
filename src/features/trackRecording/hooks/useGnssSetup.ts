/**
 * External dependencies
 */
import { useCallback, useEffect, useMemo } from 'react';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { selectIsActive } from '../../gnss/selectors';
import { setGnssPosition } from '../../gnss/slice';
import type { GnssPosition } from 'react-native-mapsforge-vtm';
import {
	selectIsRecording,
	selectMinDistance,
	selectMinTime,
	selectMinPrecision,
	selectResumePending,
	selectUseDemAltitude,
} from '../selectors';
import { writeGnssPosition } from '../slice';

/**
 * Relaxed gate params for plain GNSS activation (no recording).  The
 * live stream is always raw — these params only gate the recording
 * stream, which the JS side ignores while not recording.
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
 * {@code onGnssPosition} / {@code onGnssLive} callbacks for
 * {@code MapContainer}.
 *
 * The native listener is registered with raw parameters — every fix
 * (~1 Hz) reaches JS through {@code onGnssLive} and feeds the gnss
 * slice's live position (marker, speed/course widgets). The native
 * recording gate (minDistance/minTime/minAccuracy) emits
 * {@code onGnssPosition} only for track-recording-qualifying positions;
 * those are forwarded via {@code writeGnssPosition} to the
 * track-recording listener for persistence.
 *
 * The filter is set while GNSS is active or track recording is running,
 * and {@code undefined} otherwise — the native {@code LocationListener}
 * is unregistered by the view manager when the filter is removed.
 *
 * @returns {{ gnssFilter, handleGnssLive, handleGnssPosition }}
 */
export function useGnssSetup() {
	const dispatch = useAppDispatch();
	const isRecording = useAppSelector(selectIsRecording);
	const resumePending = useAppSelector(selectResumePending);
	const gnssIsActive = useAppSelector(selectIsActive);
	const minDistance = useAppSelector(selectMinDistance);
	const minTime = useAppSelector(selectMinTime);
	const minPrecision = useAppSelector(selectMinPrecision);
	const useDemAltitude = useAppSelector(selectUseDemAltitude);

	const gnssFilter = useMemo(() => {
		if (isRecording || resumePending) {
			// DEM elevation when the HGT tile is cached (background
			// preload on miss — next fix gets the cached value), raw
			// GNSS altitude otherwise. These fields gate the native
			// recording stream only — the live stream stays raw.
			const altitudeSource = useDemAltitude ? 'dem-preferred' : 'gnss-only';
			return {
				minDistanceMeters: minDistance,
				minTimeSec: minTime,
				minAccuracyMeters: minPrecision,
				provider: 'satellite' as const,
				altitudeSource: altitudeSource as 'dem-preferred' | 'gnss-only',
			};
		}
		if (gnssIsActive) {
			return GNSS_IDLE_FILTER;
		}
		return undefined;
	}, [
		isRecording,
		resumePending,
		gnssIsActive,
		minDistance,
		minTime,
		minPrecision,
		useDemAltitude,
	]);

	// Live stream (onGnssLive) — every native fix. Feeds the gnss
	// slice's live position only.
	const handleGnssLive = useCallback(
		(event: { nativeEvent: GnssPosition }) => {
			const { lng, lat, gnssAltitude, bearing, accuracy, speed, timestamp } =
				event.nativeEvent;
			// Live display always uses the raw GNSS altitude — the DEM
			// toggle only affects what is stored, not what is shown.
			dispatch(
				setGnssPosition({
					lng,
					lat,
					altitude: gnssAltitude,
					bearing,
					accuracy,
					speed,
					timestamp,
				})
			);
		},
		[dispatch]
	);

	// Recording stream (onGnssPosition) — natively gated positions.
	// Forwards to the track-recording listener for persistence.
	const handleGnssPosition = useCallback(
		(event: { nativeEvent: GnssPosition }) => {
			const { lng, lat, altitude } = event.nativeEvent;
			if (isRecording || resumePending) {
				dispatch(
					writeGnssPosition({
						lng,
						lat,
						altitude,
					})
				);
			}
		},
		[
			dispatch,
			isRecording,
			resumePending,
		]
	);

	// Clear the stale position whenever the listener is unregistered
	// (covers e.g. stopping the recording while GNSS is off).
	useEffect(() => {
		if (!gnssFilter) {
			dispatch(setGnssPosition(null));
		}
	}, [gnssFilter, dispatch]);

	return useMemo(
		() => ({ gnssFilter, handleGnssLive, handleGnssPosition }),
		[
			gnssFilter,
			handleGnssLive,
			handleGnssPosition,
		]
	);
}
