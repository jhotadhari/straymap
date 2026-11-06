/**
 * External dependencies
 */
import { useMemo } from 'react';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../store/hooks';
import { selectMinTime } from '../../trackRecording/selectors';
import { selectDerivedSpeed, selectGnssPosition } from '../selectors';
import { useNow } from './useNow';

/**
 * Reported speed at or below this is treated as "no reported speed" for
 * the derived-speed fallback.
 */
export const REPORTED_SPEED_EPSILON_MPS = 0.5;
/**
 * Derived speed clearly above this (while the reported speed is at or
 * below epsilon) wins over the reported value — covers sources that
 * move positions without reporting a speed (e.g. GPS spoofers), without
 * making the normal pedestrian case jumpy.
 */
export const DERIVED_SPEED_FALLBACK_MIN_MPS = 5;

/**
 * Live GNSS speed with staleness handling. Fixes arrive densely (~1 Hz)
 * through the native live stream, so a stopped user gets fresh fixes
 * with speed 0 naturally; the staleness gate below only covers true
 * signal loss (no fix for more than one second beyond the configured
 * recording `minTime`, e.g. in a tunnel), where it reads as 0. Returns
 * null while there is no fix at all (GNSS off).
 *
 * Normally the fix's reported speed is used (smoother than position
 * deltas at 1 Hz).  When it reads ~0 while the consecutive-fix derived
 * speed is clearly moving, the derived value wins — the reported field
 * is what GPS spoofers leave unset while still moving positions.
 */
export const useGnssSpeed = (): number | null => {
	const position = useAppSelector(selectGnssPosition);
	const derivedSpeed = useAppSelector(selectDerivedSpeed);
	const minTime = useAppSelector(selectMinTime);
	const now = useNow(1000);

	return useMemo(() => {
		if (!position) {
			return null;
		}
		if (now - position.timestamp > (minTime + 1) * 1000) {
			return 0;
		}
		if (
			position.speed <= REPORTED_SPEED_EPSILON_MPS &&
			derivedSpeed != null &&
			derivedSpeed > DERIVED_SPEED_FALLBACK_MIN_MPS
		) {
			return derivedSpeed;
		}
		return position.speed;
	}, [
		position,
		derivedSpeed,
		minTime,
		now,
	]);
};
