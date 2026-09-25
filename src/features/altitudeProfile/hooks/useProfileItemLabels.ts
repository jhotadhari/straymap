/**
 * External dependencies
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../store/hooks';
import { selectProfileLines } from '../../lines/selectors';
import { queryLinesWithoutGeom } from '../../lines/db/queryFns';
import { LinePartial } from '../../lines/types';
import { getAltitudeProfileSourceKey } from '../types';

/**
 * Labels for the derived altitudeProfile bottom drawer menu entries:
 * a fixed i18n label for the routing source, and the real line titles
 * (batched query, cached) for the per-line sources.
 */
export const useProfileItemLabels = (): Record<string, string> => {
	const { t } = useTranslation();

	const profileLines = useAppSelector(selectProfileLines);

	const { data: lines } = useQuery({
		queryKey: ['lines', profileLines],
		queryFn: queryLinesWithoutGeom,
		enabled: profileLines.length > 0,
	});

	return useMemo(() => {
		const labels: Record<string, string> = {
			[getAltitudeProfileSourceKey.routing()]: t('altitudeProfile.routingTitle'),
		};
		(lines ?? []).forEach((line: LinePartial) => {
			if (typeof line?.id === 'number') {
				labels[getAltitudeProfileSourceKey.line(line.id)] = line.title ?? `${line.id}`;
			}
		});
		return labels;
	}, [t, lines]);
};
