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
import { selectChartLines } from '../../lines/selectors';
import { queryLinesWithoutGeom } from '../../lines/db/queryFns';
import { LinePartial } from '../../lines/types';
import { selectDateTimeFormat } from '../../general/selectors';
import dayjs from '../../../lib/dayjs';
import { getChartSourceKey } from '../types';

/**
 * Labels for the derived chart bottom drawer menu entries:
 * a fixed i18n label for the routing source, and the real line titles
 * (batched query, cached) for the per-line sources.
 */
export const useChartItemLabels = (): Record<string, string> => {
	const { t } = useTranslation();

	const chartLines = useAppSelector(selectChartLines);
	const dateTimeFormat = useAppSelector(selectDateTimeFormat);

	const { data: lines } = useQuery({
		queryKey: ['lines', chartLines],
		queryFn: queryLinesWithoutGeom,
		enabled: chartLines.length > 0,
	});

	return useMemo(() => {
		const labels: Record<string, string> = {
			[getChartSourceKey.routing()]: t('chart.routingTitle'),
		};
		(lines ?? []).forEach((line: LinePartial) => {
			if (typeof line?.id === 'number') {
				labels[getChartSourceKey.line(line.id)] =
					line.title ?? dayjs(line.custom_date ?? line.created_at).format(dateTimeFormat);
			}
		});
		return labels;
	}, [
		t,
		lines,
		dateTimeFormat,
	]);
};
