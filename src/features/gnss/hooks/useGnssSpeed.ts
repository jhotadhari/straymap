/**
 * External dependencies
 */
import { useMemo } from 'react';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../store/hooks';
import { selectMinTime } from '../../trackRecording/selectors';
import { selectGnssPosition } from '../selectors';
import { useNow } from './useNow';

/**
 * Live GNSS speed with staleness handling. Fixes arrive densely (~1 Hz)
 * through the native live stream, so a stopped user gets fresh fixes
 * with speed 0 naturally; the staleness gate below only covers true
 * signal loss (no fix for more than one second beyond the configured
 * recording `minTime`, e.g. in a tunnel), where it reads as 0. Returns
 * null while there is no fix at all (GNSS off).
 */
export const useGnssSpeed = (): number | null => {
	const position = useAppSelector(selectGnssPosition);
	const minTime = useAppSelector(selectMinTime);
	const now = useNow(1000);

	return useMemo(() => {
		if (!position) {
			return null;
		}
		if (now - position.timestamp > (minTime + 1) * 1000) {
			return 0;
		}
		return position.speed;
	}, [
		position,
		minTime,
		now,
	]);
};
