/**
 * External dependencies
 */
import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../store/hooks';
import { selectGnssPosition } from '../../gnss/selectors';
import { selectTrackLineId } from '../../trackRecording/selectors';
import { queryLineGeom } from '../db/queryFns';
import useActivateDrawerItem from '../../drawers/hooks/useActivateDrawerItem';
import useFlyToPosition from './useFlyToPosition';

/**
 * Shared press behavior of the recording indicators (the row dot button
 * and the recording badge in the lines drawer panel): centers the map
 * on the last recorded point of the track (the end of the line's
 * geometry) — falling back to the last GNSS fix while no geometry
 * exists yet — and opens the tracking drawer panel.
 *
 * No-op when neither a recorded point nor a GNSS fix is available.
 */
const useCenterRecordingPosition = () => {
	const gnssPosition = useAppSelector(selectGnssPosition);
	const trackLineId = useAppSelector(selectTrackLineId);
	const activateTrackingDrawerItem = useActivateDrawerItem('tracking');
	const flyToPosition = useFlyToPosition();

	const { data: line } = useQuery({
		queryKey: ['lineGeom', trackLineId ?? -1],
		queryFn: queryLineGeom,
		enabled: typeof trackLineId === 'number',
		gcTime: 1000 * 60 * 5,
	});

	const lastRecordedPoint = useMemo<[number, number] | null>(() => {
		const coords = line?.geometry?.coordinates;
		if (!coords?.length) {
			return null;
		}
		const last = coords[coords.length - 1];
		return [last[0], last[1]];
	}, [line]);

	const centerOnRecording = useCallback(async () => {
		// Preferred target: the last recorded point; fallback: the live
		// GNSS fix (before the recording line exists or while points lag
		// behind the fix).
		const target =
			lastRecordedPoint ??
			(gnssPosition ? ([gnssPosition.lng, gnssPosition.lat] as [number, number]) : null);
		if (!target) {
			return;
		}

		// Open the tracking drawer panel alongside the fly-to.
		activateTrackingDrawerItem();

		await flyToPosition(target);
	}, [
		lastRecordedPoint,
		gnssPosition,
		activateTrackingDrawerItem,
		flyToPosition,
	]);

	return centerOnRecording;
};

export default useCenterRecordingPosition;
