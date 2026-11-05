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
 * Live GNSS course over ground (COG) with staleness handling: while
 * stationary the native GNSS listener may stop delivering fixes, which
 * would keep the last course forever. When the last fix is older than
 * one second beyond the configured recording `minTime`, the course
 * reads as null — COG is undefined when not moving. Returns null while
 * there is no fix at all (GNSS off) and while no heading has been
 * derived yet.
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
		return heading;
	}, [
		position,
		heading,
		minTime,
		now,
	]);
};
