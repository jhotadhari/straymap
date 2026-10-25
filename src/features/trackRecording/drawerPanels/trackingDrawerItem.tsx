/**
 * External dependencies
 */
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, TextStyle } from 'react-native';
import { Text, useTheme, Button } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import MdiIcons from '@react-native-vector-icons/material-icons/static';

/**
 * Internal dependencies
 */
import { DrawerPanel } from '../../drawers/types';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { selectIsActive } from '../../gnss/selectors';
import { setIsActive } from '../../gnss/slice';
import { selectIsRecording, selectActiveLineId, selectRecordingStartTime } from '../selectors';
import { stopRecording } from '../slice';
import { queryLineGeom } from '../../lines/db/queryFns';
import {
	formatDistance,
	haversineLineLength,
	formatDurationCompact,
} from '../../../lib/formatting';
import { selectUnitPrefs } from '../../general/selectors';

/**
 * Dynamic handle icon: gps-not-fixed (no center dot) while GNSS is off,
 * gps-fixed (with center dot) while GNSS is on, and red (with dot) while
 * track recording is active.
 */
const TrackingDrawerIcon: FC<{
	color?: TextStyle['color'];
	size?: number;
}> = ({ color, size }) => {
	const theme = useTheme();
	const isActive = useAppSelector(selectIsActive);
	const isRecording = useAppSelector(selectIsRecording);

	const iconName = isActive || isRecording ? 'gps-fixed' : 'gps-not-fixed';
	const iconColor = isRecording ? theme.colors.error : color;

	return (
		<MdiIcons
			name={iconName}
			color={iconColor}
			size={size}
		/>
	);
};

/**
 * Combined tracking panel: track recording stats/controls plus the GNSS
 * status rows and activation toggle. The GNSS values show dashes until
 * the GNSS position pipeline provides real data (no map-center
 * fallback — that would be misleading).
 */
const TrackingDrawerContent: FC = () => {
	const { t } = useTranslation();
	const theme = useTheme();
	const dispatch = useAppDispatch();

	const isRecording = useAppSelector(selectIsRecording);
	const isActive = useAppSelector(selectIsActive);
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
			'trackingDrawer',
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
	const distUnit = unitPrefs?.distance;

	const handleStop = useCallback(() => {
		dispatch(stopRecording());
	}, [dispatch]);

	const handleToggleGnss = useCallback(() => {
		dispatch(setIsActive(!isActive));
	}, [dispatch, isActive]);

	return (
		<View style={styles.container}>
			<Text style={theme.fonts.titleMedium}>{t('trackRecording.tracking')}</Text>

			<View style={styles.row}>
				<Text>{t('trackRecording.trackRecording')}:</Text>
				<Text style={styles.value}>
					{isRecording
						? `${formatDurationCompact(elapsed)} · ${formatDistance(distance, distUnit)}`
						: t('trackRecording.notRecording')}
				</Text>
			</View>

			{isRecording && (
				<>
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
				</>
			)}

			{/* GNSS values render dashes until the position pipeline
				provides real data — deliberately no map-center fallback. */}
			<View style={styles.row}>
				<Text>{t('gnss.gnssCoordinates')}:</Text>
				<Text style={styles.value}>-</Text>
			</View>

			<View style={styles.row}>
				<Text>{t('gnss.gnssAccuracy')}:</Text>
				<Text style={styles.value}>-</Text>
			</View>

			<View style={styles.row}>
				<Text>{t('gnss.gnssAltitude')}:</Text>
				<Text style={styles.value}>-</Text>
			</View>

			<View style={styles.row}>
				<Text>{t('gnss.gnssSpeed')}:</Text>
				<Text style={styles.value}>-</Text>
			</View>

			<Button
				mode={isActive ? 'outlined' : 'contained'}
				onPress={handleToggleGnss}
				style={styles.button}
			>
				{isActive ? t('gnss.deactivateGnss') : t('gnss.activateGnss')}
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
	button: {
		marginTop: 8,
	},
});

export default {
	key: 'tracking',
	label: 'trackRecording.tracking',
	DisplayComponent: TrackingDrawerContent,
	IconComponent: TrackingDrawerIcon,
} as DrawerPanel;
