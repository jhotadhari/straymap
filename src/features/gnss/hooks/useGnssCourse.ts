/**
 * External dependencies
 */
import { useMemo } from 'react';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../store/hooks';
import { selectGnssHeading } from '../selectors';
import { useGnssSpeed } from './useGnssSpeed';

/**
 * Speed below which the device is considered "not moving" — course over
 * ground is undefined while stationary, so the hook reads as null there.
 */
const SPEED_EPSILON_MPS = 0.5;

/**
 * Live GNSS course over ground (COG).  "Stopped" is detected via the
 * same effective speed the speed widget shows (`useGnssSpeed` — the
 * reported speed, or the latched derived fallback for sources that move
 * positions without reporting a speed): when it reads below
 * {@link SPEED_EPSILON_MPS}, the course is null (COG is undefined when
 * not moving).  Returns null while there is no fix at all (GNSS off)
 * and while no heading has been derived yet.
 */
export const useGnssCourse = (): number | null => {
	const heading = useAppSelector(selectGnssHeading);
	const speed = useGnssSpeed();

	return useMemo(() => {
		if (speed == null || speed < SPEED_EPSILON_MPS) {
			return null;
		}
		return heading;
	}, [
		speed,
		heading,
	]);
};
