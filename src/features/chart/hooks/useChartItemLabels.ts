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
import { selectRoutingLineId } from '../../routing/selectors';
import { selectActiveLineId, selectIsRecording } from '../../trackRecording/selectors';
import { selectFollowingLineId } from '../../lineFollow/selectors';

/**
 * Labels for the derived chart bottom drawer menu entries. Every chart
 * key is now `chart:line:<id>` — a line's title, plus an aggregated
 * suffix for any modes the line carries (routing / following / recording).
 */
export const useChartItemLabels = (): Record<string, string> => {
	const { t } = useTranslation();

	const chartLines = useAppSelector(selectChartLines);
	const dateTimeFormat = useAppSelector(selectDateTimeFormat);
	const routingLineId = useAppSelector(selectRoutingLineId);
	const isRecording = useAppSelector(selectIsRecording);
	const activeLineId = useAppSelector(selectActiveLineId);
	const followingLineId = useAppSelector(selectFollowingLineId);

	const lineIds = useMemo(() => {
		const ids = new Set<number>(chartLines);
		if (routingLineId != null) {
			ids.add(routingLineId);
		}
		if (isRecording && activeLineId != null) {
			ids.add(activeLineId);
		}
		if (followingLineId != null) {
			ids.add(followingLineId);
		}
		return [...ids];
	}, [
		chartLines,
		routingLineId,
		isRecording,
		activeLineId,
		followingLineId,
	]);

	const { data: lines } = useQuery({
		queryKey: ['lines', lineIds],
		queryFn: queryLinesWithoutGeom,
		enabled: lineIds.length > 0,
	});

	return useMemo(() => {
		const labels: Record<string, string> = {};
		(lines ?? []).forEach((line: LinePartial) => {
			if (typeof line?.id !== 'number') {
				return;
			}
			const base =
				line.title ?? dayjs(line.custom_date ?? line.created_at).format(dateTimeFormat);
			const modes: string[] = [];
			if (line.id === routingLineId) {
				modes.push(t('chart.modeRouting'));
			}
			if (line.id === followingLineId) {
				modes.push(t('chart.modeFollowing'));
			}
			if (isRecording && line.id === activeLineId) {
				modes.push(t('chart.modeRecording'));
			}
			labels[getChartSourceKey.line(line.id)] = modes.length
				? `${base} · ${modes.join(' · ')}`
				: base;
		});
		return labels;
	}, [
		t,
		lines,
		dateTimeFormat,
		routingLineId,
		followingLineId,
		activeLineId,
		isRecording,
	]);
};
