/**
 * External dependencies
 */
import { memo, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { get, pick } from 'lodash-es';
import { useQuery } from '@tanstack/react-query';
import { Text } from 'react-native-paper';
import { sprintf } from 'sprintf-js';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import ModalWrapper from '../../../../components/generic/wrapper/ModalWrapper';
import { sharedStyles } from '../../../../sharedStyles';
import { LinePartial } from '../../types';
import { queryLinesWithoutGeom } from '../../db/queryFns';
import {
	queryTrackPointsStatsByLineIds,
	LineTrackPointsStats,
} from '../../../trackRecording/db/queryFns';
import { queryLinePointsStatsByLineIds } from '../../db/lineTimeStats';
import LineStatsRows from './LineStatsRows';
import LineTrackingStatsRows, { aggregateTrackingStats } from './LineTrackingStatsRows';
import { aggregateLineStats } from './sharedDeps';

/**
 * Shared stats modal for one or many lines: the aggregated geometry
 * stats, plus a recording-metadata section (duration, moving/pause
 * time, avg/max speed, point count) whenever at least one selected
 * line has track_points data.  Partial coverage is flagged with a note.
 */
const LineStatsModal = memo(
	({
		lineIds,
		handleDismissModal,
		showHeader,
	}: {
		lineIds: number[];
		handleDismissModal: () => void;
		showHeader?: boolean;
	}) => {
		const { t } = useTranslation();

		const { data: lines } = useQuery({
			queryKey: ['lines', lineIds],
			queryFn: queryLinesWithoutGeom,
			select: (ls: LinePartial[]) => ls.map((line) => pick(line, ['stats'])),
		});

		const stats = useMemo(
			() => aggregateLineStats((lines ?? []) as { stats?: any }[]),
			[lines]
		);

		// Stable query key regardless of the ids' order/identity.
		const lineIdsKey = useMemo(() => [...lineIds].sort((a, b) => a - b).join(','), [lineIds]);

		const { data: perLineStats } = useQuery({
			queryKey: [
				'lineTrackPoints',
				lineIdsKey,
				'stats',
			],
			queryFn: () => queryTrackPointsStatsByLineIds(lineIds),
			enabled: lineIds.length > 0,
			staleTime: Infinity,
			gcTime: 1000 * 10,
		});

		// Imported tracks' time stats (line_points).  Disjoint from
		// track_points: a line has recording metadata OR imported
		// point metadata, never both.
		const { data: importedStats } = useQuery({
			queryKey: [
				'linePoints',
				lineIdsKey,
				'stats',
			],
			queryFn: () => queryLinePointsStatsByLineIds(lineIds),
			enabled: lineIds.length > 0,
			staleTime: Infinity,
			gcTime: 1000 * 10,
		});

		const tracking = useMemo(() => {
			const { values, coveredCount, totalCount } = aggregateTrackingStats(
				(perLineStats ?? []).map((stats) => ({ lineId: stats.lineId, stats })),
				lineIds.length
			);
			// Average speed = aggregated geometry length over aggregated
			// moving time (moving-time-weighted, consistent with the
			// geometry section's length source).
			const length = get(stats, 'length', 0) as number;
			return {
				values: {
					...values,
					avgSpeedMps: values.movingMs > 0 ? length / (values.movingMs / 1000) : null,
				},
				coveredCount,
				totalCount,
			};
		}, [
			perLineStats,
			stats,
			lineIds,
		]);

		const imported = useMemo(() => {
			const { values, coveredCount, totalCount } = aggregateTrackingStats(
				(importedStats ?? []).map((s) => ({
					lineId: s.lineId,
					stats: s as LineTrackPointsStats,
				})),
				lineIds.length
			);
			const length = get(stats, 'length', 0) as number;
			return {
				values: {
					...values,
					avgSpeedMps: values.movingMs > 0 ? length / (values.movingMs / 1000) : null,
				},
				coveredCount,
				totalCount,
			};
		}, [
			importedStats,
			stats,
			lineIds,
		]);

		return (
			<ModalWrapper
				visible={true}
				onDismiss={handleDismissModal}
				headerLabel={t('lines.statsSummary')}
				innerStyle={sharedStyles.modal}
			>
				{showHeader && <Text>{sprintf(t('lines.statsForLines'), lineIds.length)}</Text>}

				<LineStatsRows stats={stats} />

				{tracking.coveredCount > 0 && (
					<>
						{tracking.coveredCount === tracking.totalCount && (
							<Text style={styles.sectionHeading}>{t('lines.statsRecording')}</Text>
						)}
						{tracking.coveredCount < tracking.totalCount && (
							<Text style={styles.sectionHeading}>
								{sprintf(
									t('lines.statsRecordingPartial'),
									tracking.coveredCount,
									tracking.totalCount
								)}
							</Text>
						)}
						<LineTrackingStatsRows values={tracking.values} />
					</>
				)}

				{imported.coveredCount > 0 && (
					<>
						{imported.coveredCount === imported.totalCount && (
							<Text style={styles.sectionHeading}>{t('lines.statsTime')}</Text>
						)}
						{imported.coveredCount < imported.totalCount && (
							<Text style={styles.sectionHeading}>
								{sprintf(
									t('lines.statsTimePartial'),
									imported.coveredCount,
									imported.totalCount
								)}
							</Text>
						)}
						<LineTrackingStatsRows values={imported.values} />
					</>
				)}
			</ModalWrapper>
		);
	}
);

LineStatsModal.displayName = 'LineStatsModal';

const styles = StyleSheet.create({
	sectionHeading: {
		fontWeight: '600',
		marginTop: 16,
	},
});

export default LineStatsModal;
