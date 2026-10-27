/**
 * External dependencies
 */
import React, { FC, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, TextStyle } from 'react-native';
import { Text, useTheme, Button } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { get } from 'lodash-es';
import MdiIcons from '@react-native-vector-icons/material-icons/static';

/**
 * Internal dependencies
 */
import { DrawerPanel } from '../../drawers/types';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { selectIsActive, selectGnssPosition } from '../../gnss/selectors';
import { setIsActive } from '../../gnss/slice';
import { selectIsRecording, selectActiveLineId, selectRecordingStartTime } from '../selectors';
import { selectResumePending } from '../selectors';
import { startRecording, stopRecording, continueRecording } from '../slice';
import { queryLineGeom } from '../../lines/db/queryFns';
import { queryLastRecordedLine } from '../db/queryFns';
import { MenuActionOption } from '../../../types';
import ButtonHighlightMenuControl from '../../../components/generic/wrapper/ButtonHighlightMenuControl';
import {
	formatDistance,
	haversineLineLength,
	formatDurationCompact,
	formatCoords,
	formatHeightDepth,
	formatSpeed,
} from '../../../lib/formatting';
import { selectUnitPrefs } from '../../general/selectors';
import ensureLocationPermission from '../../../lib/locationPermission';
import ensureNotificationPermission from '../../../lib/notificationPermission';
import { useDestructiveColor } from '../../../compose/useButtonProps';
import { ErrorToastContext } from '../../../components/ErrorToast/Context';

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
	const destructiveColor = useDestructiveColor();
	const isActive = useAppSelector(selectIsActive);
	const isRecording = useAppSelector(selectIsRecording);

	const iconName = isActive || isRecording ? 'gps-fixed' : 'gps-not-fixed';
	// While recording, the unified destructive red. While GNSS is active
	// but the drawer handle is not selected, the handle passes a
	// background-colored icon (invisible in dark mode) — keep it visible.
	const iconColor = isRecording ? destructiveColor : isActive ? theme.colors.onBackground : color;

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
	const destructiveColor = useDestructiveColor();
	const dispatch = useAppDispatch();

	const { showError } = useContext(ErrorToastContext);

	const isRecording = useAppSelector(selectIsRecording);
	const isActive = useAppSelector(selectIsActive);
	const resumePending = useAppSelector(selectResumePending);
	const gnssPosition = useAppSelector(selectGnssPosition);
	const activeLineId = useAppSelector(selectActiveLineId);
	const recordingStartTime = useAppSelector(selectRecordingStartTime);
	const unitPrefs = useAppSelector(selectUnitPrefs);

	const coordUnit = get(unitPrefs, ['coordinates', 'unit'], 'dd');
	const coordRound = get(unitPrefs, ['coordinates', 'round'], 4);
	const coordsPadLng = get(unitPrefs, ['coordinates', 'coordsPadLng']);
	const coordsPadLat = get(unitPrefs, ['coordinates', 'coordsPadLat']);
	const coordsOrder = get(unitPrefs, ['coordinates', 'coordsOrder']);
	const coordsForceNE = get(unitPrefs, ['coordinates', 'coordsForceNE']);
	const heightUnit = get(unitPrefs, ['heightDepth']);
	const speedUnit = get(unitPrefs, ['speed']);

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
		],
		queryFn: queryLineGeom,
		enabled: !!activeLineId,
		staleTime: Infinity,
		gcTime: 1000 * 10,
	});

	const { data: lastRecordedLineId } = useQuery({
		queryKey: ['lastRecordedLine'],
		queryFn: queryLastRecordedLine,
		staleTime: Infinity,
		gcTime: 1000 * 10,
	});

	const distance = useMemo(() => {
		if (!line?.geometry?.coordinates) return 0;
		return haversineLineLength(line.geometry.coordinates);
	}, [line]);

	const pointCount = line?.geometry?.coordinates?.length ?? 0;
	const distUnit = unitPrefs?.distance;

	const handleStartNew = useCallback(async () => {
		const granted = await ensureLocationPermission();
		if (!granted) {
			showError(t('gnss.permissionDenied'));
			return;
		}
		await ensureNotificationPermission();
		dispatch(startRecording());
	}, [
		dispatch,
		showError,
		t,
	]);

	const handleContinueLast = useCallback(async () => {
		if (typeof lastRecordedLineId !== 'number') {
			return;
		}
		const granted = await ensureLocationPermission();
		if (!granted) {
			showError(t('gnss.permissionDenied'));
			return;
		}
		await ensureNotificationPermission();
		dispatch(continueRecording(lastRecordedLineId));
	}, [
		dispatch,
		lastRecordedLineId,
		showError,
		t,
	]);

	const handleToggleRecording = useCallback(async () => {
		if (isRecording) {
			dispatch(stopRecording());
			return;
		}
		await handleStartNew();
	}, [
		dispatch,
		isRecording,
		handleStartNew,
	]);

	const startMenuOptions = useMemo<MenuActionOption[]>(
		() => [
			{
				key: 'startNew',
				label: 'trackRecording.startNew',
				leadingIcon: 'record-rec',
				cb: handleStartNew,
			},
			{
				key: 'continueLast',
				label: 'trackRecording.continueLast',
				leadingIcon: 'play',
				cb: handleContinueLast,
			},
		],
		[handleStartNew, handleContinueLast]
	);

	const handleToggleGnss = useCallback(async () => {
		if (!isActive) {
			const granted = await ensureLocationPermission();
			if (!granted) {
				showError(t('gnss.permissionDenied'));
				return;
			}
		}
		dispatch(setIsActive(!isActive));
	}, [
		dispatch,
		isActive,
		showError,
		t,
	]);

	return (
		<View style={styles.container}>
			<Text style={theme.fonts.titleMedium}>{t('trackRecording.tracking')}</Text>

			<View style={styles.row}>
				<Text>{t('trackRecording.trackRecording')}:</Text>
				<Text style={styles.value}>
					{isRecording
						? `${formatDurationCompact(elapsed)} · ${formatDistance(distance, distUnit)}`
						: resumePending
							? t('trackRecording.resuming')
							: t('trackRecording.notRecording')}
				</Text>
			</View>

			{isRecording && (
				<View style={styles.row}>
					<Text>{t('trackRecording.pointCount')}:</Text>
					<Text style={styles.value}>{pointCount}</Text>
				</View>
			)}

			{isRecording ? (
				<Button
					mode="contained"
					onPress={handleToggleRecording}
					style={styles.button}
					icon={'stop'}
					buttonColor={destructiveColor}
				>
					{t('trackRecording.stop')}
				</Button>
			) : typeof lastRecordedLineId === 'number' ? (
				<ButtonHighlightMenuControl
					anchorLabel={t('trackRecording.start')}
					anchorIcon={'record-rec'}
					options={startMenuOptions}
				/>
			) : (
				<Button
					mode="contained"
					onPress={handleToggleRecording}
					style={styles.button}
					icon={'record-rec'}
				>
					{t('trackRecording.start')}
				</Button>
			)}
			{/* Live GNSS values from the gnss slice — dashes until the
				native listener delivers the first position. */}
			<View style={styles.row}>
				<Text>{t('gnss.gnssCoordinates')}:</Text>
				<Text style={styles.value}>
					{gnssPosition
						? formatCoords(
								gnssPosition.lat,
								gnssPosition.lng,
								{
									unit: coordUnit,
									round: coordRound,
									coordsPadLng,
									coordsPadLat,
									coordsOrder,
									coordsForceNE,
								},
								t
							)
						: '-'}
				</Text>
			</View>

			<View style={styles.row}>
				<Text>{t('gnss.gnssAccuracy')}:</Text>
				<Text style={styles.value}>
					{gnssPosition ? `${gnssPosition.accuracy.toFixed(1)} m` : '-'}
				</Text>
			</View>

			<View style={styles.row}>
				<Text>{t('gnss.gnssAltitude')}:</Text>
				<Text style={styles.value}>
					{gnssPosition?.altitude == null
						? '-'
						: formatHeightDepth(gnssPosition.altitude, heightUnit)}
				</Text>
			</View>

			<View style={styles.row}>
				<Text>{t('gnss.gnssSpeed')}:</Text>
				<Text style={styles.value}>
					{gnssPosition ? formatSpeed(gnssPosition.speed, speedUnit) : '-'}
				</Text>
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
		marginLeft: 4,
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
