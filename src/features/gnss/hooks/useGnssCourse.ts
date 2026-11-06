/**
 * External dependencies
 */
import { useMemo } from 'react';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../store/hooks';
import { selectMinTime } from '../../trackRecording/selectors';
import { selectGnssHeading, selectGnssPosition } from '../selectors';
import { useNow } from './useNow';

/**
 * Speed below which the device is considered "not moving" — course over
 * ground is undefined while stationary, so the hook reads as null there.
 */
const SPEED_EPSILON_MPS = 0.5;

/**
 * Live GNSS course over ground (COG). Fixes arrive densely (~1 Hz)
 * through the native live stream, so "stopped" is detected by speed:
 * when the latest fix's speed is below {@link SPEED_EPSILON_MPS}, the
 * course reads as null (COG is undefined when not moving). The
 * staleness gate additionally covers true signal loss (no fix for more
 * than one second beyond the configured recording `minTime`). Returns
 * null while there is no fix at all (GNSS off) and while no heading has
 * been derived yet.
 */
export const useGnssCourse = (): number | null => {
	const position = useAppSelector(selectGnssPosition);
	const heading = useAppSelector(selectGnssHeading);
	const minTime = useAppSelector(selectMinTime);
	const now = useNow(1000);

	return useMemo(() => {
		if (!position) {
			return null;
		}
		if (now - position.timestamp > (minTime + 1) * 1000) {
			return null;
		}
		if ((position.speed ?? 0) < SPEED_EPSILON_MPS) {
			return null;
		}
		return heading;
	}, [
		position,
		heading,
		minTime,
		now,
	]);
};
