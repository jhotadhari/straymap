/**
 * External dependencies
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../store/hooks';
import { queryLinePathCoords } from '../../lines/db/queryFns';
import { selectGnssPosition } from '../../gnss/selectors';
import { computeProgress, LineProgress } from '../progress';

/**
 * Live follow-progress stats for a line, driven by the current GNSS
 * position projected onto the line's simplified coordinates. Returns
 * undefined until both the geometry and a GNSS fix are available.
 */
export const useFollowProgress = (lineId: number | null | undefined): LineProgress | undefined => {
	const gnss = useAppSelector(selectGnssPosition);

	const id = lineId ?? undefined;
	const { data: coordinates } = useQuery({
		queryKey: ['linePathCoords', id],
		queryFn: queryLinePathCoords,
		enabled: id !== undefined,
	});

	return useMemo(() => {
		if (!coordinates || !gnss) {
			return undefined;
		}
		return computeProgress(coordinates, [gnss.lng, gnss.lat]);
	}, [coordinates, gnss]);
};
