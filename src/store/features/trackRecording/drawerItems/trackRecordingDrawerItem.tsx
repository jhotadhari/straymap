/**
 * External dependencies
 */
import React, { FC, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, Button } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import { DrawerItem } from '../../drawers/types';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { selectIsRecording, selectActiveLineId, selectLastWrittenTime } from '../selectors';
import { stopRecording } from '../slice';
import { queryLineGeom } from '../../lines/db/queryFns';
import { formatDistance } from '../../../../lib/formatting';
import { selectUnitPrefs } from '../../general/selectors';
import DrawerContext from '../../drawers/DrawerContext';

const TrackRecordingDrawerContent: FC = () => {
	const { t } = useTranslation();
	const theme = useTheme();
	const dispatch = useAppDispatch();

	const { height } = useContext(DrawerContext);

	const isRecording = useAppSelector(selectIsRecording);
	const activeLineId = useAppSelector(selectActiveLineId);
	const lastWrittenTime = useAppSelector(selectLastWrittenTime);
	const unitPrefs = useAppSelector(selectUnitPrefs);

	const [elapsed, setElapsed] = useState(0);
	const timerRef = useRef<NodeJS.Timeout | null>(null);
	useEffect(() => {
		if (!isRecording || !lastWrittenTime) {
			setElapsed(0);
			return;
		}
		timerRef.current = setInterval(() => {
			setElapsed(Math.floor((Date.now() - lastWrittenTime) / 1000));
		}, 1000);
		return () => {
			timerRef.current && clearInterval(timerRef.current);
		};
	}, [isRecording, lastWrittenTime]);

	const lineId = activeLineId ?? -1;
	const { data: line } = useQuery({
		queryKey: ['lineGeom', lineId, 'drawer'],
		queryFn: queryLineGeom,
		enabled: !!activeLineId,
		gcTime: 1000 * 10,
	});

	const distance = useMemo(() => {
		if (!line?.geometry?.coordinates) return 0;
		const coords = line.geometry.coordinates;
		const R = 6371000;
		const toRad = (deg: number) => (deg * Math.PI) / 180;
		let total = 0;
		for (let i = 1; i < coords.length; i++) {
			const [lng1, lat1] = coords[i - 1];
			const [lng2, lat2] = coords[i];
			const dLat = toRad(lat2 - lat1);
			const dLng = toRad(lng2 - lng1);
			const a =
				Math.sin(dLat / 2) * Math.sin(dLat / 2) +
				Math.cos(toRad(lat1)) *
					Math.cos(toRad(lat2)) *
					Math.sin(dLng / 2) *
					Math.sin(dLng / 2);
			total += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		}
		return total;
	}, [line]);

	const pointCount = line?.geometry?.coordinates?.length ?? 0;

	const distUnit = get(unitPrefs, ['distance']);

	const formatDuration = (sec: number) => {
		const h = Math.floor(sec / 3600);
		const m = Math.floor((sec % 3600) / 60);
		const s = sec % 60;
		if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
		return `${m}:${s.toString().padStart(2, '0')}`;
	};

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
				<Text style={styles.value}>{formatDuration(elapsed)}</Text>
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
} as DrawerItem;
