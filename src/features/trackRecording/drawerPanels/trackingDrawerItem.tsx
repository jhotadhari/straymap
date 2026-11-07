/**
 * External dependencies
 */
import React, {
	Dispatch,
	FC,
	SetStateAction,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import { View, StyleSheet, TextStyle } from 'react-native';
import { Text, useTheme, Divider, Switch } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { get } from 'lodash-es';
import MdiIcons from '@react-native-vector-icons/material-icons/static';

/**
 * Internal dependencies
 */
import { DrawerPanel } from '../../drawers/types';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { selectIsActive, selectGnssPosition, selectIsCenterActive } from '../../gnss/selectors';
import { setIsActive, setIsCenterActive } from '../../gnss/slice';
import { useGnssSpeed } from '../../gnss/hooks/useGnssSpeed';
import { useGnssCourse } from '../../gnss/hooks/useGnssCourse';
import { selectIsRecording, selectActiveLineId, selectRecordingStartTime } from '../selectors';
import { selectResumePending } from '../selectors';
import { startRecording, stopRecording, continueRecording } from '../slice';
import { queryLineGeom } from '../../lines/db/queryFns';
import { queryLastRecordedLine } from '../db/queryFns';
import { setUiItemKeys } from '../../ui/slice';
import { itemStyles, DRAWER_HANDLE_SIZE, DRAWER_ICON_SIZE } from '../../drawers/constants';
import { useButtonProps, useDestructiveColor } from '../../../compose/useButtonProps';
import ButtonHighlight from '../../../components/generic/primitives/ButtonHighlight';
import IconButtonHighlight from '../../../components/generic/primitives/IconButtonHighlight';
import { MenuActionOption } from '../../../types';
import ButtonHighlightMenuControl from '../../../components/generic/wrapper/ButtonHighlightMenuControl';
import {
	formatDistance,
	haversineLineLength,
	formatDurationCompact,
	formatCoords,
	formatHeightDepth,
	formatSpeed,
	formatBearing,
} from '../../../lib/formatting';
import { selectUnitPrefs } from '../../general/selectors';
import ensureLocationPermission from '../../../lib/locationPermission';
import ensureNotificationPermission from '../../../lib/notificationPermission';
import { ErrorToastContext } from '../../../components/ErrorToast/Context';
import RecordingLineWidthControl from '../components/controls/RecordingLineWidthControl';
import { sharedStyles } from '../../../sharedStyles';

/**
 * Dynamic handle icon: gps-not-fixed (no center dot) while GNSS is off,
 * gps-fixed (with center dot) while GNSS is on, and red (with dot) while
 * track recording is active.
 */
export const TrackingDrawerIcon: FC<{
	color?: TextStyle['color'];
	size?: number;
	style?: TextStyle;
}> = ({ color, size, style }) => {
	const theme = useTheme();
	const destructiveColor = useDestructiveColor();
	const isActive = useAppSelector(selectIsActive);
	const isRecording = useAppSelector(selectIsRecording);
	const isHandleActive = useAppSelector(
		(state) =>
			state.drawers.activeKeyLeft === 'tracking' ||
			state.drawers.activeKeyRight === 'tracking'
	);

	const iconName = isActive || isRecording ? 'gps-fixed' : 'gps-not-fixed';
	// While recording, always red — a lighter red on the dark selected
	// handle so the dot stays visible against the dark background.
	// Otherwise the handle's own color (dark in dark mode for unselected
	// handles).
	const recordingRed = theme.dark && isHandleActive ? theme.colors.error : destructiveColor;
	const iconColor = isRecording ? recordingRed : color;

	return (
		<MdiIcons
			name={iconName}
			color={iconColor}
			size={size}
			style={style}
		/>
	);
};

/**
 * A single label + right-aligned value row used for the GNSS telemetry
 * and the track-recording statistics, so both groups share one visual
 * language (muted label left, tabular value right).
 */
const StatRow: FC<{ label: string; value: string }> = ({ label, value }) => (
	<View style={styles.statRow}>
		<Text style={styles.statLabel}>{label}</Text>
		<Text
			style={styles.statValue}
			numberOfLines={1}
		>
			{value}
		</Text>
	</View>
);

/**
 * Combined tracking panel: location/GNSS status and toggles plus the
 * track-recording stats and controls, structured as two sections.
 *
 * Rendered as scroll content (DisplayComponentScroll) — the panel has
 * enough rows that it no longer fits once the bottom drawer is open,
 * and without scrolling the bottom rows would be unreachable. The
 * scroll-enable props are accepted for the DrawerPanel contract; this
 * panel has no sortable/drag interactions that would need to pause
 * scrolling.
 */
const TrackingDrawerContent: FC<{
	scrollEnabled: boolean;
	setScrollEnabled: Dispatch<SetStateAction<boolean>>;
}> = () => {
	const { t } = useTranslation();
	const theme = useTheme();
	const dispatch = useAppDispatch();

	const { showError } = useContext(ErrorToastContext);

	const openLocationSettings = useCallback(
		() => dispatch(setUiItemKeys(['location'])),
		[dispatch]
	);

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { nestedIconColor: _stopNestedIconColor, ...stopButtonProps } = useButtonProps({
		isDestructive: true,
	});
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { nestedIconColor: _startNestedIconColor, ...startButtonProps } = useButtonProps({
		isSuccess: true,
	});

	const isRecording = useAppSelector(selectIsRecording);
	const isActive = useAppSelector(selectIsActive);
	const isCenterActive = useAppSelector(selectIsCenterActive);
	const resumePending = useAppSelector(selectResumePending);
	const gnssPosition = useAppSelector(selectGnssPosition);
	const gnssCourse = useGnssCourse();
	const speed = useGnssSpeed();
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
				leadingIcon: 'play',
				cb: handleStartNew,
			},
			{
				key: 'continueLast',
				label: 'trackRecording.continueLast',
				leadingIcon: 'play-pause',
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
			dispatch(setIsActive(true));
			return;
		}
		dispatch(setIsActive(false));
	}, [
		dispatch,
		isActive,
		showError,
		t,
	]);

	const handleToggleCenterMode = useCallback(() => {
		// Center mode is a standalone persisted setting — toggling it must
		// not touch GNSS. While GNSS is off it simply waits for a fix.
		dispatch(setIsCenterActive(!isCenterActive));
	}, [dispatch, isCenterActive]);

	return (
		<View style={itemStyles.item}>
			<View style={styles.container}>
				<View style={styles.headerWrap}>
					<View style={[itemStyles.buttonRow, styles.header]}>
						<Text style={styles.heading}>{t('gnss.locationAndGnss')}</Text>
						<IconButtonHighlight
							icon="cog"
							iconColor={theme.colors.onSurfaceVariant}
							onPress={openLocationSettings}
							accessibilityLabel={t('drawers.openLocationSettings')}
						/>
					</View>
				</View>

				{/* Location & GNSS section */}
				<View style={sharedStyles.gap}>
					<View style={styles.switchRow}>
						<View style={styles.switchLabelWrap}>
							<Text style={styles.switchLabel}>{t('gnss.gnssLocation')}</Text>
							<Text style={styles.switchHint}>{t('gnss.hintGnssLocation')}</Text>
						</View>
						<Switch
							value={isActive}
							onValueChange={handleToggleGnss}
						/>
					</View>

					<View style={styles.switchRow}>
						<View style={styles.switchLabelWrap}>
							<Text style={styles.switchLabel}>{t('gnss.centerMapOnPosition')}</Text>
							<Text style={styles.switchHint}>
								{t('gnss.hintCenterMapOnPosition')}
							</Text>
						</View>
						<Switch
							value={isCenterActive}
							onValueChange={handleToggleCenterMode}
						/>
					</View>

					<View>
						<StatRow
							label={t('gnss.gnssCoordinates')}
							value={
								gnssPosition
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
									: '-'
							}
						/>
						<StatRow
							label={t('gnss.gnssAccuracy')}
							value={gnssPosition ? `${gnssPosition.accuracy.toFixed(1)} m` : '-'}
						/>
						<StatRow
							label={t('gnss.gnssAltitude')}
							value={
								gnssPosition?.altitude == null
									? '-'
									: formatHeightDepth(gnssPosition.altitude, heightUnit)
							}
						/>
						<StatRow
							label={t('gnss.gnssSpeed')}
							value={speed == null ? '-' : formatSpeed(speed, speedUnit)}
						/>
						<StatRow
							label={t('gnss.gnssCourse')}
							value={gnssCourse === null ? '-' : formatBearing(gnssCourse)}
						/>
					</View>
				</View>

				<Divider style={styles.sectionDivider} />

				{/* Track recording section */}
				<View style={sharedStyles.gap}>
					{isRecording ? (
						<ButtonHighlight
							{...stopButtonProps}
							onPress={handleToggleRecording}
							icon="pause"
						>
							{t('trackRecording.stop')}
						</ButtonHighlight>
					) : typeof lastRecordedLineId === 'number' ? (
						<ButtonHighlightMenuControl
							anchorLabel={t('trackRecording.start')}
							options={startMenuOptions}
							buttonPropsProps={{ isSuccess: true }}
						/>
					) : (
						<ButtonHighlight
							{...startButtonProps}
							onPress={handleToggleRecording}
						>
							{t('trackRecording.start')}
						</ButtonHighlight>
					)}

					<View>
						{isRecording ? (
							<>
								<StatRow
									label={t('trackRecording.trackingDuration')}
									value={formatDurationCompact(elapsed)}
								/>
								<StatRow
									label={t('trackRecording.trackingDistance')}
									value={formatDistance(distance, distUnit)}
								/>
								<StatRow
									label={t('trackRecording.trackingPointCount')}
									value={String(pointCount)}
								/>
							</>
						) : (
							<Text style={styles.idleText}>
								{resumePending
									? t('trackRecording.resuming')
									: t('trackRecording.notRecording')}
							</Text>
						)}
					</View>

					<View style={styles.lineWidthRow}>
						<Text style={styles.statLabel}>{t('trackRecording.lineWidth')}</Text>
						<RecordingLineWidthControl />
					</View>
				</View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		// // No top padding — the header row carries the buttonRow vertical
		// // margin, so it lands exactly where the other panels' first rows
		// // do (aligned with the drawer handle).
		paddingTop: 0,
		paddingBottom: 16,
		paddingHorizontal: 16,
	},
	headerWrap: {
		// Same negative offset the lines/routing DrawerTopBar uses — paired
		// with buttonRow's marginTop it puts the first row at the content
		// origin, exactly overlapping the 50dp handle box.
		top: -(DRAWER_HANDLE_SIZE - DRAWER_ICON_SIZE) / 6,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		// Fixed handle-height row: centers the heading/cog on the same
		// vertical center as the drawer handle icon.
		height: DRAWER_HANDLE_SIZE,
		// buttonRow adds marginHorizontal 16 for padding-less panels; the
		// container here already has its own 16px padding.
		marginHorizontal: 0,
		marginRight: -12,
	},
	heading: {
		fontSize: 20,
		fontWeight: 'bold',
	},
	sectionDivider: {
		// Full-bleed: extends through the container's 16px padding so the
		// line spans the entire drawer width, visibly splitting the two
		// sections like a grouped list.
		marginHorizontal: -16,
		marginVertical: 24,
	},
	switchRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	switchLabelWrap: {
		flex: 1,
		gap: 2,
	},
	switchLabel: {
		fontWeight: '600',
	},
	switchHint: {
		fontSize: 12,
		opacity: 0.6,
	},
	statRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	statLabel: {
		opacity: 0.6,
	},
	statValue: {
		// Always occupy the remaining row width so every value — short or
		// long — is flush against the same right edge.
		flex: 1,
		textAlign: 'right',
	},
	idleText: {
		opacity: 0.6,
	},
	lineWidthRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 12,
	},
});

export default {
	key: 'tracking',
	label: 'gnss.locationAndGnss',
	DisplayComponentScroll: TrackingDrawerContent,
	IconComponent: TrackingDrawerIcon,
} as DrawerPanel;
