/**
 * External dependencies
 */
import { useMemo } from 'react';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../store/hooks';
import { selectDerivedSpeed, selectGnssPosition, selectSpeedFallbackActive } from '../selectors';
import { useNow } from './useNow';

/**
 * Live fixes arrive ~1 Hz; beyond this age the fix is treated as stale
 * (true signal loss, e.g. a tunnel) and the speed reads as 0.
 * Deliberately independent of the recording `minTime` — that gate shapes
 * the recording stream, not the live stream (sources with a ~1.5 s fix
 * cadence must not trip the staleness gate).
 */
export const LIVE_STALE_MS = 3000;

/**
 * Live GNSS speed with staleness handling. Fixes arrive densely (~1 Hz)
 * through the native live stream, so a stopped user gets fresh fixes
 * with speed 0 naturally; the staleness gate only covers true signal
 * loss, where it reads as 0. Returns null while there is no fix at all
 * (GNSS off).
 *
 * Normally the fix's reported speed is used (smoother than position
 * deltas at 1 Hz).  The gnss slice latches a derived-speed fallback
 * (debounced engagement, hysteresis on exit — see slice.ts) for sources
 * that move positions without reporting a speed (GPS spoofers); while
 * that latch is active, the derived value is shown instead.
 */
export const useGnssSpeed = (): number | null => {
	const position = useAppSelector(selectGnssPosition);
	const derivedSpeed = useAppSelector(selectDerivedSpeed);
	const speedFallbackActive = useAppSelector(selectSpeedFallbackActive);
	const now = useNow(1000);

	return useMemo(() => {
		if (!position) {
			return null;
		}
		if (now - position.timestamp > LIVE_STALE_MS) {
			return 0;
		}
		if (speedFallbackActive && derivedSpeed != null) {
			return derivedSpeed;
		}
		return position.speed;
	}, [
		position,
		derivedSpeed,
		speedFallbackActive,
		now,
	]);
};
