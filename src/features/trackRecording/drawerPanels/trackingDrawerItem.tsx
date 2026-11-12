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
 * Button icons rendered through the app's MCI set with Android font
 * padding disabled so the glyph shares the label's line metrics —
 * Paper's string icons keep the default padding, which pushes the glyph
 * off the text's vertical center (most visible on the play triangle).
 */
const iconStyles = StyleSheet.create({
	glyph: {
		includeFontPadding: false,
	},
});

const makeRecordingButtonIcon =
	(name: React.ComponentProps<typeof MdiIcons>['name']) =>
	({ size, color }: { size: number; color: string }) => (
		<MdiIcons
			name={name}
			size={size}
			color={color}
			style={iconStyles.glyph}
		/>
	);

const RecordingPlayButtonIcon = makeRecordingButtonIcon('play-arrow');
const RecordingPauseButtonIcon = makeRecordingButtonIcon('pause');

/**
 * Internal dependencies
 */
import { DrawerPanel } from '../../drawers/types';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { selectIsActive, selectGnssPosition, selectIsCenterActive } from '../../gnss/selectors';
import { setIsActive, setIsCenterActive } from '../../gnss/slice';
import { useGnssSpeed } from '../../gnss/hooks/useGnssSpeed';
import { useGnssCourse } from '../../gnss/hooks/useGnssCourse';
import {
	selectIsRecording,
	selectActiveLineId,
	selectTrackLineId,
	selectRecordingStartTime,
	selectRecordedDistanceM,
} from '../selectors';
import { selectResumePending, selectLastRecordedLineId } from '../selectors';
import { startRecording, stopRecording, continueRecording } from '../slice';
import { queryLineGeom } from '../../lines/db/queryFns';
import { setLineTemp } from '../../lines/slice';
import { queryTrackByLineId, queryTrackPointsStats } from '../db/queryFns';
import { getTrackSummary } from '../db/actionsTrack';
import { setUiItemKeys } from '../../ui/slice';
import { itemStyles, DRAWER_HANDLE_SIZE, DRAWER_ICON_SIZE } from '../../drawers/constants';
import { useButtonProps, useDestructiveColor } from '../../../compose/useButtonProps';
import ButtonHighlight from '../../../components/generic/primitives/ButtonHighlight';
import IconCustom from '../../../components/generic/primitives/IconCustom';
import DrawerPanelHeading from '../../drawers/components/DrawerPanelHeading';
import { MenuActionOption } from '../../../types';
import ButtonHighlightMenuControl from '../../../components/generic/wrapper/ButtonHighlightMenuControl';
import {
	formatDistance,
	formatDurationCompact,
	formatCoords,
	formatHeightDepth,
	formatSpeed,
	formatBearing,
} from '../../../lib/formatting';
import { selectUnitPrefs } from '../../general/selectors';
import { UnitPref } from '../../general/types';
import ensureLocationPermission from '../../../lib/locationPermission';
import ensureNotificationPermission from '../../../lib/notificationPermission';
import { ErrorToastContext } from '../../../components/ErrorToast/Context';
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
 * Values of the nine track-recording stat rows.  Rendered identically
 * while recording (live values) and while idle (last summary values),
 * so toggling recording only morphs values in place — never the layout.
 */
interface TrackStatsValues {
	durationSec: number | null;
	distanceM: number;
	pointCount: number;
	uphill: number;
	downhill: number;
	avgSpeedMps: number | null;
	maxSpeedMps: number | null;
	movingSec: number | null;
	pauseSec: number | null;
}

const TrackStatsRows: FC<{
	values: TrackStatsValues;
	distUnit: UnitPref;
	heightUnit: UnitPref;
	speedUnit: UnitPref;
}> = ({ values, distUnit, heightUnit, speedUnit }) => {
	const { t } = useTranslation();
	return (
		<>
			<StatRow
				label={t('trackRecording.trackingDuration')}
				value={values.durationSec == null ? '-' : formatDurationCompact(values.durationSec)}
			/>
			<StatRow
				label={t('trackRecording.trackingDistance')}
				value={formatDistance(values.distanceM, distUnit)}
			/>
			<StatRow
				label={t('trackRecording.trackingPointCount')}
				value={String(values.pointCount)}
			/>
			<StatRow
				label={t('trackRecording.trackingUphill')}
				value={formatHeightDepth(values.uphill, heightUnit)}
			/>
			<StatRow
				label={t('trackRecording.trackingDownhill')}
				value={formatHeightDepth(values.downhill, heightUnit)}
			/>
			<StatRow
				label={t('trackRecording.trackingAvgSpeed')}
				value={
					values.avgSpeedMps == null ? '-' : formatSpeed(values.avgSpeedMps, speedUnit)
				}
			/>
			<StatRow
				label={t('trackRecording.trackingMaxSpeed')}
				value={
					values.maxSpeedMps == null ? '-' : formatSpeed(values.maxSpeedMps, speedUnit)
				}
			/>
			<StatRow
				label={t('trackRecording.trackingMovingDuration')}
				value={values.movingSec == null ? '-' : formatDurationCompact(values.movingSec)}
			/>
			<StatRow
				label={t('trackRecording.trackingPauseDuration')}
				value={values.pauseSec == null ? '-' : formatDurationCompact(values.pauseSec)}
			/>
		</>
	);
};

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
	// The line the track-recording feature currently owns: the actively
	// recorded line, or the line parked after a stop.  Drives the edit
	// button opening LineEditModal.
	const recordingLineId = useAppSelector(selectTrackLineId);
	const { nestedIconColor: editNestedIconColor, ...editButtonProps } = useButtonProps({
		disabled: typeof recordingLineId !== 'number',
		// Tight horizontal content padding so the icon-only button stays
		// compact — same sizing as the routing top bar's edit button.
		paddingHorizontal: true,
	});
	const recordingStartTime = useAppSelector(selectRecordingStartTime);
	const unitPrefs = useAppSelector(selectUnitPrefs);
	// The drawer's idle "last recording" comes from Redux, not a DB
	// lookup: set on stopRecording, cleared when that line is deleted.
	// A DB-derived fallback would resurrect an older recorded line's
	// stats right after the user deleted their last recording.
	const lastRecordedLineId = useAppSelector(selectLastRecordedLineId);

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

	// Aggregate over the active line's track_points — one cheap SQL
	// aggregate per fix (the per-append invalidation keeps it live).
	const { data: pointsStats } = useQuery({
		queryKey: [
			'lineTrackPoints',
			lineId,
			'stats',
		],
		queryFn: () => queryTrackPointsStats(lineId),
		enabled: isRecording && !!activeLineId,
		staleTime: Infinity,
		gcTime: 1000 * 10,
	});

	// Last recording's cached summary (tracks.data) for the idle view.
	// getTrackSummary verifies freshness and recomputes when stale.
	const { data: lastTrackSummary } = useQuery({
		queryKey: ['trackSummary', lastRecordedLineId],
		queryFn: async () => {
			if (typeof lastRecordedLineId !== 'number') {
				return null;
			}
			const track = await queryTrackByLineId(lastRecordedLineId);
			if (!track?.id) {
				return null;
			}
			return getTrackSummary(track.id, lastRecordedLineId);
		},
		enabled: !isRecording && typeof lastRecordedLineId === 'number',
		staleTime: Infinity,
		gcTime: 1000 * 10,
	});

	// Live distance comes from the incrementally accumulated Redux value
	// (O(1) per fix) — no rescan of the growing geometry.
	const distance = useAppSelector(selectRecordedDistanceM) ?? 0;

	const pointCount = line?.geometry?.coordinates?.length ?? 0;
	const distUnit = unitPrefs?.distance;

	const coords = line?.geometry?.coordinates;

	const { uphill, downhill } = useMemo(() => {
		let up = 0;
		let down = 0;
		if (coords) {
			for (let i = 1; i < coords.length; i++) {
				const dz = (coords[i][2] ?? 0) - (coords[i - 1][2] ?? 0);
				if (dz > 0) {
					up += dz;
				} else {
					down += -dz;
				}
			}
		}
		return { uphill: up, downhill: down };
	}, [coords]);

	const movingMs = pointsStats?.movingDurationMs ?? 0;
	const avgSpeed = movingMs > 0 ? distance / (movingMs / 1000) : null;

	// Duration, moving and pause all come from the SAME fetched stats
	// snapshot (no Date.now() in the mix): they update together per fix,
	// stay internally consistent and can never step backwards.  Falls
	// back to the session timer only before the first metadata rows
	// exist (the first two fixes).
	const statsDurationMs =
		pointsStats?.startTs != null && pointsStats?.endTs != null
			? Math.max(0, pointsStats.endTs - pointsStats.startTs)
			: null;
	const liveDurationSec = statsDurationMs != null ? Math.floor(statsDurationMs / 1000) : elapsed;
	const livePauseSec =
		statsDurationMs != null ? Math.max(0, Math.floor((statsDurationMs - movingMs) / 1000)) : 0;

	// Live values while recording.
	const recordingStats: TrackStatsValues = {
		durationSec: liveDurationSec,
		distanceM: distance,
		pointCount,
		uphill,
		downhill,
		avgSpeedMps: avgSpeed,
		maxSpeedMps: pointsStats?.maxSpeed ?? null,
		movingSec: pointsStats ? Math.floor(movingMs / 1000) : null,
		pauseSec: pointsStats ? livePauseSec : null,
	};

	// The same rows sourced from the last recording's summary while idle.
	const idleStats: TrackStatsValues | null = lastTrackSummary
		? {
				durationSec:
					lastTrackSummary.totalDurationMs == null
						? null
						: Math.floor(lastTrackSummary.totalDurationMs / 1000),
				distanceM: lastTrackSummary.distanceM,
				pointCount: lastTrackSummary.pointCount,
				uphill: lastTrackSummary.ascentM,
				downhill: lastTrackSummary.descentM,
				avgSpeedMps: lastTrackSummary.avgSpeedMps,
				maxSpeedMps: lastTrackSummary.maxSpeedMps,
				movingSec:
					lastTrackSummary.movingDurationMs == null
						? null
						: Math.floor(lastTrackSummary.movingDurationMs / 1000),
				pauseSec:
					lastTrackSummary.pauseDurationMs == null
						? null
						: Math.floor(lastTrackSummary.pauseDurationMs / 1000),
			}
		: null;

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

	const handleEditLine = useCallback(() => {
		if (typeof recordingLineId === 'number') {
			dispatch(setLineTemp({ id: recordingLineId }));
		}
	}, [
		dispatch,
		recordingLineId,
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
					<DrawerPanelHeading
						title={t('gnss.locationAndGnss')}
						actionIcon="cog"
						onActionPress={openLocationSettings}
						actionAccessibilityLabel={t('drawers.openLocationSettings')}
						style={styles.header}
					/>
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
					<View style={styles.recordButtonsRow}>
						<ButtonHighlight
							{...editButtonProps}
							onPress={handleEditLine}
							compact={true}
						>
							<IconCustom
								name="route_cog"
								size={20}
								color={editNestedIconColor}
							/>
						</ButtonHighlight>
						{isRecording ? (
							<ButtonHighlight
								{...stopButtonProps}
								style={styles.recordToggleButton}
								onPress={handleToggleRecording}
								icon={RecordingPauseButtonIcon}
							>
								{t('trackRecording.stop')}
							</ButtonHighlight>
						) : typeof lastRecordedLineId === 'number' ? (
							<View style={styles.recordToggleButton}>
								<ButtonHighlightMenuControl
									anchorLabel={t('trackRecording.start')}
									anchorIcon={RecordingPlayButtonIcon}
									options={startMenuOptions}
									buttonPropsProps={{
										isSuccess: true,
									}}
								/>
							</View>
						) : (
							<ButtonHighlight
								{...startButtonProps}
								style={styles.recordToggleButton}
								onPress={handleToggleRecording}
								icon={RecordingPlayButtonIcon}
							>
								{t('trackRecording.start')}
							</ButtonHighlight>
						)}
					</View>

					<View>
						{isRecording ? (
							<TrackStatsRows
								values={recordingStats}
								distUnit={distUnit}
								heightUnit={heightUnit}
								speedUnit={speedUnit}
							/>
						) : resumePending ? (
							<Text style={styles.idleText}>{t('trackRecording.resuming')}</Text>
						) : idleStats ? (
							<TrackStatsRows
								values={idleStats}
								distUnit={distUnit}
								heightUnit={heightUnit}
								speedUnit={speedUnit}
							/>
						) : (
							<Text style={styles.idleText}>{t('trackRecording.notRecording')}</Text>
						)}
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
		// Fixed handle-height row: centers the heading/cog on the same
		// vertical center as the drawer handle icon.
		height: DRAWER_HANDLE_SIZE,
		// buttonRow adds marginHorizontal 16 for padding-less panels; the
		// container here already has its own 16px padding.
		marginHorizontal: 0,
		marginRight: -12,
	},
	sectionDivider: {
		// Full-bleed: extends through the container's 16px padding so the
		// line spans the entire drawer width, visibly splitting the two
		// sections like a grouped list.
		marginHorizontal: -16,
		marginVertical: 24,
	},
	recordButtonsRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	recordToggleButton: {
		flex: 1,
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
});

export default {
	key: 'tracking',
	label: 'gnss.locationAndGnss',
	DisplayComponentScroll: TrackingDrawerContent,
	IconComponent: TrackingDrawerIcon,
} as DrawerPanel;
