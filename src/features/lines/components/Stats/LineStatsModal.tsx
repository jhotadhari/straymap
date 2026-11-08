/**
 * External dependencies
 */
import { memo, useMemo } from 'react';
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
import { buildTrackingStatsSection, MetadataStatsSection } from './LineTrackingStatsRows';
import { aggregateLineStats } from './sharedDeps';

/**
 * Shared stats modal for one or many lines: the aggregated geometry
 * stats, plus one metadata section per source — recording metadata
 * (track_points) and imported track time stats (line_points) — whenever
 * at least one selected line carries that source.  Partial coverage is
 * flagged via the section heading.
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

		// Geometry length feeds the sections' avg-speed derivation
		// (aggregated length over aggregated moving time).
		const geometryLength = get(stats, 'length', 0) as number;

		const recordingSection = useMemo(
			() => ({
				...buildTrackingStatsSection(
					(perLineStats ?? []).map((stats) => ({ lineId: stats.lineId, stats })),
					lineIds.length,
					geometryLength
				),
				headingKey: 'lines.statsRecording',
				partialKey: 'lines.statsRecordingPartial',
			}),
			[
				perLineStats,
				lineIds,
				geometryLength,
			]
		);

		const importedSection = useMemo(
			() => ({
				...buildTrackingStatsSection(
					(importedStats ?? []).map((s) => ({
						lineId: s.lineId,
						stats: s as LineTrackPointsStats,
					})),
					lineIds.length,
					geometryLength
				),
				headingKey: 'lines.statsTime',
				partialKey: 'lines.statsTimePartial',
			}),
			[
				importedStats,
				lineIds,
				geometryLength,
			]
		);

		return (
			<ModalWrapper
				visible={true}
				onDismiss={handleDismissModal}
				headerLabel={t('lines.statsSummary')}
				innerStyle={sharedStyles.modal}
			>
				{showHeader && <Text>{sprintf(t('lines.statsForLines'), lineIds.length)}</Text>}

				<LineStatsRows stats={stats} />

				<MetadataStatsSection section={recordingSection} />
				<MetadataStatsSection section={importedSection} />
			</ModalWrapper>
		);
	}
);

LineStatsModal.displayName = 'LineStatsModal';

export default LineStatsModal;
