/**
 * External dependencies
 */
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, Button } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import { DrawerPanel } from '../../drawers/types';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { selectIsRecording, selectActiveLineId, selectRecordingStartTime } from '../selectors';
import { stopRecording } from '../slice';
import { queryLineGeom } from '../../lines/db/queryFns';
import {
	formatDistance,
	haversineLineLength,
	formatDurationCompact,
} from '../../../../lib/formatting';
import { selectUnitPrefs } from '../../general/selectors';

const TrackRecordingDrawerContent: FC = () => {
	const { t } = useTranslation();
	const theme = useTheme();
	const dispatch = useAppDispatch();

	const isRecording = useAppSelector(selectIsRecording);
	const activeLineId = useAppSelector(selectActiveLineId);
	const recordingStartTime = useAppSelector(selectRecordingStartTime);
	const unitPrefs = useAppSelector(selectUnitPrefs);

	// Live elapsed timer based on recording start
	const [elapsed, setElapsed] = useState(0);
	const timerRef = useRef<NodeJS.Timeout | null>(null);
	useEffect(() => {
		if (!isRecording || !recordingStartTime) {
			setElapsed(0);
			return;
		}
		timerRef.current = setInterval(() => {
			setElapsed(Math.floor((Date.now() - recordingStartTime) / 1000));
		}, 1000);
		return () => {
			timerRef.current && clearInterval(timerRef.current);
		};
	}, [isRecording, recordingStartTime]);

	const lineId = activeLineId ?? -1;
	const { data: line } = useQuery({
		queryKey: [
			'lineGeom',
			lineId,
			'drawer',
		],
		queryFn: queryLineGeom,
		enabled: !!activeLineId,
		staleTime: Infinity,
		gcTime: 1000 * 10,
	});

	const distance = useMemo(() => {
		if (!line?.geometry?.coordinates) return 0;
		return haversineLineLength(line.geometry.coordinates);
	}, [line]);

	const pointCount = line?.geometry?.coordinates?.length ?? 0;
	const distUnit = get(unitPrefs, ['distance']);

	const handleStop = useCallback(() => {
		dispatch(stopRecording());
	}, [dispatch]);

	if (!isRecording) {
		return (
			<View style={styles.container}>
				<Text style={theme.fonts.titleMedium}>{t('trackRecording.title')}</Text>
				<Text style={styles.inactive}>{t('trackRecording.notRecording')}</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<Text style={theme.fonts.titleMedium}>{t('trackRecording.title')}</Text>

			<View style={styles.row}>
				<Text>{t('trackRecording.distance')}:</Text>
				<Text style={styles.value}>{formatDistance(distance, distUnit)}</Text>
			</View>

			<View style={styles.row}>
				<Text>{t('trackRecording.duration')}:</Text>
				<Text style={styles.value}>{formatDurationCompact(elapsed)}</Text>
			</View>

			<View style={styles.row}>
				<Text>{t('trackRecording.pointCount')}:</Text>
				<Text style={styles.value}>{pointCount}</Text>
			</View>

			<Button
				mode="contained"
				onPress={handleStop}
				style={styles.stopButton}
				buttonColor={theme.colors.error}
			>
				{t('trackRecording.stop')}
			</Button>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		padding: 16,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 12,
	},
	value: {
		fontWeight: 'bold',
	},
	stopButton: {
		marginTop: 16,
	},
	inactive: {
		marginTop: 8,
		opacity: 0.6,
	},
});

export default {
	key: 'trackRecording',
	label: 'trackRecording.title',
	DisplayComponent: TrackRecordingDrawerContent,
	iconSource: 'record-rec',
} as DrawerPanel;
