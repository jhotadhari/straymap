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
 * Live GNSS speed with staleness handling: while stationary the native
 * GNSS listener may stop delivering fixes, which would keep the last
 * speed forever. When the last fix is older than one second beyond the
 * configured recording `minTime`, the speed reads as 0. Returns null
 * while there is no fix at all (GNSS off).
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
