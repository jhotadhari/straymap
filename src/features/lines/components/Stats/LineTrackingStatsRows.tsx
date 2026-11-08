/**
 * External dependencies
 */
import { FC, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { get } from 'lodash-es';
import { useTranslation } from 'react-i18next';
import { sprintf } from 'sprintf-js';
import { Text } from 'react-native-paper';

/**
 * Internal dependencies
 */
import InfoLabelRow from '../../../../components/generic/infoWrapper/InfoLabelRow';
import { formatDurationCompact, formatSpeed } from '../../../../lib/formatting';
import { useAppSelector } from '../../../../store/hooks';
import { selectUnitPrefs } from '../../../general/selectors';
import { UnitPref } from '../../../general/types';
import { LineTrackPointsStats } from '../../../trackRecording/db/queryFns';

/**
 * Aggregated tracking (track_points) stats across the lines that have
 * recording metadata.  Additive fields sum, max speed takes the max.
 * `avgSpeedMps` is left for the caller to derive (total geometry length
 * over total moving time), so the aggregation stays independent of the
 * geometry source.
 */
export interface TrackingStatsValues {
	durationMs: number;
	movingMs: number;
	pauseMs: number;
	avgSpeedMps: number | null;
	maxSpeedMps: number | null;
	pointCount: number;
}

export const EMPTY_TRACKING_STATS: TrackingStatsValues = {
	durationMs: 0,
	movingMs: 0,
	pauseMs: 0,
	avgSpeedMps: null,
	maxSpeedMps: null,
	pointCount: 0,
};

export const aggregateTrackingStats = (
	entries: { lineId: number; stats: LineTrackPointsStats }[],
	totalCount: number
): { values: TrackingStatsValues; coveredCount: number; totalCount: number } => {
	const values = entries.reduce<TrackingStatsValues>((acc, { stats }) => {
		const durationMs =
			stats.startTs != null && stats.endTs != null
				? Math.max(0, stats.endTs - stats.startTs)
				: 0;
		return {
			durationMs: acc.durationMs + durationMs,
			movingMs: acc.movingMs + stats.movingDurationMs,
			pauseMs: acc.pauseMs + Math.max(0, durationMs - stats.movingDurationMs),
			avgSpeedMps: acc.avgSpeedMps,
			maxSpeedMps:
				stats.maxSpeed == null
					? acc.maxSpeedMps
					: acc.maxSpeedMps == null
						? stats.maxSpeed
						: Math.max(acc.maxSpeedMps, stats.maxSpeed),
			pointCount: acc.pointCount + stats.count,
		};
	}, EMPTY_TRACKING_STATS);
	return {
		values,
		coveredCount: entries.length,
		totalCount,
	};
};

/**
 * Recording-metadata stat rows for the stats modal — the six values the
 * track_points data adds that geometry stats can't provide (no
 * distance/ascent duplicates of the geometry section).
 */
const LineTrackingStatsRows: FC<{ values: TrackingStatsValues }> = ({ values }) => {
	const { t } = useTranslation();
	const unitPrefs = useAppSelector(selectUnitPrefs);

	const speedUnit = useMemo(() => get(unitPrefs, ['speed']) as UnitPref, [unitPrefs]);

	return (
		<>
			<InfoLabelRow label={t('trackRecording.trackingDuration')}>
				<Text>{formatDurationCompact(Math.floor(values.durationMs / 1000))}</Text>
			</InfoLabelRow>
			<InfoLabelRow label={t('trackRecording.trackingMovingDuration')}>
				<Text>{formatDurationCompact(Math.floor(values.movingMs / 1000))}</Text>
			</InfoLabelRow>
			<InfoLabelRow label={t('trackRecording.trackingPauseDuration')}>
				<Text>{formatDurationCompact(Math.floor(values.pauseMs / 1000))}</Text>
			</InfoLabelRow>
			<InfoLabelRow label={t('trackRecording.trackingAvgSpeed')}>
				<Text>
					{values.avgSpeedMps == null ? '-' : formatSpeed(values.avgSpeedMps, speedUnit)}
				</Text>
			</InfoLabelRow>
			<InfoLabelRow label={t('trackRecording.trackingMaxSpeed')}>
				<Text>
					{values.maxSpeedMps == null ? '-' : formatSpeed(values.maxSpeedMps, speedUnit)}
				</Text>
			</InfoLabelRow>
			<InfoLabelRow label={t('trackRecording.trackingPointCount')}>
				<Text>{String(values.pointCount)}</Text>
			</InfoLabelRow>
		</>
	);
};

/**
 * One metadata section of the stats modal: a heading (or the
 * partial-coverage note as heading) plus the six tracking rows.
 */
export interface MetadataStatsSectionData {
	values: TrackingStatsValues;
	coveredCount: number;
	totalCount: number;
	headingKey: string;
	partialKey: string;
}

/**
 * Aggregate one metadata source into a section's data (shared by the
 * recording and the imported sections).  Avg speed is the aggregated
 * geometry length over the aggregated moving time.
 */
export const buildTrackingStatsSection = (
	entries: { lineId: number; stats: LineTrackPointsStats }[],
	totalCount: number,
	geometryLengthM: number
): Omit<MetadataStatsSectionData, 'headingKey' | 'partialKey'> => {
	const {
		values,
		coveredCount,
		totalCount: sectionTotal,
	} = aggregateTrackingStats(entries, totalCount);
	return {
		values: {
			...values,
			avgSpeedMps: values.movingMs > 0 ? geometryLengthM / (values.movingMs / 1000) : null,
		},
		coveredCount,
		totalCount: sectionTotal,
	};
};

const MetadataStatsSection: FC<{ section: MetadataStatsSectionData }> = ({ section }) => {
	const { t } = useTranslation();
	if (section.coveredCount === 0) {
		return null;
	}
	const label =
		section.coveredCount === section.totalCount
			? t(section.headingKey)
			: sprintf(t(section.partialKey), section.coveredCount, section.totalCount);
	return (
		<>
			<Text style={styles.sectionHeading}>{label}</Text>
			<LineTrackingStatsRows values={section.values} />
		</>
	);
};

export { MetadataStatsSection };

const styles = StyleSheet.create({
	sectionHeading: {
		fontWeight: '600',
		marginTop: 16,
	},
});

export default LineTrackingStatsRows;
