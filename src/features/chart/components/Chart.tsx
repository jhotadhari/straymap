/**
 * External dependencies
 */
import React, { FC, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTheme } from 'react-native-paper';
import { MD3Theme } from 'react-native-paper/lib/typescript/types';

/**
 * Internal dependencies
 */
import {
	buildColorRuns,
	elevationToColor,
	getNiceTicks,
	ChartSeries,
	ColorRun,
	slopeToColor,
	clampTranslate,
	simplifyColorRuns,
	smoothValue,
} from '../utils';
import { ChartColorMode, ChartSeriesValue, ChartSettings } from '../types';
import { formatDistance, formatHeightDepth } from '../../../lib/formatting';
import { UnitPref } from '../../general/types';

const COLOR_PRIMARY = '#E53935';
const COLOR_SECONDARY = '#43A047';
const COLOR_CENTER = '#1A73E8';
const COLOR_WAYPOINT = '#F57C00';

const MAX_SCALE = 20;
const MIN_SCALE = 1 / MAX_SCALE;
const MARGIN_LEFT = 44;
const MARGIN_RIGHT = 40;
const MARGIN_FALLBACK = 8;
const MARGIN_TOP = 10;
const MARGIN_BOTTOM = 26;
const X_AXIS_BAND_OVERLAP = 12;
const MIN_AXIS_SEPARATION = 10;

// Follow-mode animation: the follow-derived viewport glides toward its
// target instead of jumping. Exponential smoothing (no fixed duration)
// keeps a continuously moving target stutter-free; the frame rate is
// capped so the chart's JS work stays bounded on heavy routes.
const FOLLOW_SMOOTHING = 0.25;
const FOLLOW_FRAME_MS = 33;
const FOLLOW_SNAP_TX_PX = 2;
const FOLLOW_SNAP_SCALE = 0.001;
// Quantization grids for the heavy viewport-derived memos (color-run
// simplification, ticks, PlotContent/PlotAxes transforms): they recompute
// at most per grid step, not per animation frame. The animated values
// keep full precision for the plot transform and the screen-space
// overlays.
const QUANTIZE_TX_PX = 4;
const QUANTIZE_SCALE_STEPS = 64;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Nearest index in the monotonic cumulative-distance array — binary
 * search, O(log n), instead of a full scan (the map center polls this
 * on every map event).
 */
const nearestIndex = (distances: number[], target: number): number => {
	let lo = 0;
	let hi = distances.length - 1;
	while (lo < hi) {
		const mid = Math.floor((lo + hi) / 2);
		if (distances[mid] < target) {
			lo = mid + 1;
		} else {
			hi = mid;
		}
	}
	if (lo > 0 && Math.abs(distances[lo - 1] - target) < Math.abs(distances[lo] - target)) {
		return lo - 1;
	}
	return lo;
};

const buildPathD = (xs: number[], ys: number[]): string => {
	if (!xs.length) {
		return '';
	}
	let d = `M ${xs[0]} ${ys[0]}`;
	for (let i = 1; i < xs.length; i++) {
		d += ` L ${xs[i]} ${ys[i]}`;
	}
	return d;
};

interface SeriesView {
	data: ChartSeriesValue;
	color: ChartColorMode;
	axisColor: string;
	values?: number[];
	vmin: number;
	vmax: number;
	vrange: number;
	toY: (v: number) => number;
	formatTick: (v: number) => string;
}

interface PinchBase {
	sx: number;
	sy: number;
	tx: number;
	ty: number;
	focalX: number;
	focalY: number;
	/** Initial per-axis finger separation (for the x-axis gesture). */
	dx?: number;
}

const renderSeries = (
	view: SeriesView,
	runs: { color: string; d: string }[],
	pathD: string,
	strokeWidth: number
) => {
	if (!view.values) {
		return null;
	}
	if (runs.length) {
		return runs.map((run, idx) => (
			<Path
				key={idx}
				d={run.d}
				stroke={run.color}
				strokeWidth={strokeWidth}
				vectorEffect="non-scaling-stroke"
				fill="none"
			/>
		));
	}
	return (
		<Path
			d={pathD}
			stroke={view.axisColor}
			strokeWidth={strokeWidth}
			vectorEffect="non-scaling-stroke"
			fill="none"
		/>
	);
};

/**
 * The transformed plot content (area fills and series strokes) —
 * rendered inside the animated plot `<G>` owned by `Chart`, so pure
 * viewport-translation frames never invalidate this memo.
 */
const PlotContent = memo(
	({
		seriesViews,
		primaryRenderRuns,
		secondaryRenderRuns,
		primaryFillRuns,
		secondaryFillRuns,
		paths,
	}: {
		seriesViews: { primary: SeriesView; secondary: SeriesView };
		primaryRenderRuns: ColorRun[];
		secondaryRenderRuns: ColorRun[];
		primaryFillRuns: { color: string; d: string }[];
		secondaryFillRuns: { color: string; d: string }[];
		paths: { primary: string; secondary: string };
	}) => (
		<>
			{/* Area fills first, secondary below primary. */}
			{secondaryFillRuns.map((run, idx) => (
				<Path
					key={`sf-${idx}`}
					d={run.d}
					fill={run.color}
					stroke="none"
				/>
			))}

			{primaryFillRuns.map((run, idx) => (
				<Path
					key={`pf-${idx}`}
					d={run.d}
					fill={run.color}
					stroke="none"
				/>
			))}

			{/* Secondary series first — the primary always draws above it. */}
			{renderSeries(seriesViews.secondary, secondaryRenderRuns, paths.secondary, 1.5)}

			{renderSeries(seriesViews.primary, primaryRenderRuns, paths.primary, 2)}
		</>
	)
);

/**
 * The static axes, tick marks and tick labels — drawn OUTSIDE the
 * animated plot transform, in screen space, so strokes and text never
 * get scaled or offset by the viewport. Memoized: ticks run off the
 * quantized viewport values and only recompute per grid step.
 */
const PlotAxes = memo(
	({
		seriesViews,
		ticks,
		width,
		height,
		marginLeft,
		marginRight,
		distancePref,
		theme,
		distToX,
		toScreenX,
		toScreenY,
	}: {
		seriesViews: { primary: SeriesView; secondary: SeriesView };
		ticks: { xTicks: number[]; y1Ticks: number[]; y2Ticks: number[] };
		width: number;
		height: number;
		marginLeft: number;
		marginRight: number;
		distancePref: UnitPref;
		theme: MD3Theme;
		distToX: (d: number) => number;
		toScreenX: (v: number) => number;
		toScreenY: (v: number) => number;
	}) => (
		<>
			<Line
				x1={marginLeft}
				y1={height - MARGIN_BOTTOM}
				x2={width - marginRight}
				y2={height - MARGIN_BOTTOM}
				stroke={theme.colors.outline}
				strokeWidth={1}
			/>
			{ticks.xTicks.map((tick, idx) => {
				const x = toScreenX(distToX(tick));
				if (x < marginLeft - 1 || x > width - marginRight + 1) {
					return null;
				}
				return (
					<G key={`xt-${idx}`}>
						<Line
							x1={x}
							y1={height - MARGIN_BOTTOM}
							x2={x}
							y2={height - MARGIN_BOTTOM + 4}
							stroke={theme.colors.outline}
							strokeWidth={1}
						/>
						<SvgText
							x={x}
							y={height - MARGIN_BOTTOM + 16}
							fill={theme.colors.onSurfaceVariant}
							fontSize={9}
							textAnchor="middle"
						>
							{formatDistance(tick, distancePref)}
						</SvgText>
					</G>
				);
			})}

			{seriesViews.primary.values &&
				ticks.y1Ticks.map((tick, idx) => {
					const y = toScreenY(seriesViews.primary.toY(tick));
					if (y < MARGIN_TOP - 1 || y > height - MARGIN_BOTTOM + 1) {
						return null;
					}
					return (
						<G key={`y1t-${idx}`}>
							<Line
								x1={marginLeft}
								y1={y}
								x2={marginLeft - 4}
								y2={y}
								stroke={COLOR_PRIMARY}
								strokeWidth={1}
							/>
							<SvgText
								x={marginLeft - 6}
								y={y + 3}
								fill={COLOR_PRIMARY}
								fontSize={9}
								textAnchor="end"
							>
								{seriesViews.primary.formatTick(tick)}
							</SvgText>
						</G>
					);
				})}

			{seriesViews.secondary.values &&
				ticks.y2Ticks.map((tick, idx) => {
					const y = toScreenY(seriesViews.secondary.toY(tick));
					if (y < MARGIN_TOP - 1 || y > height - MARGIN_BOTTOM + 1) {
						return null;
					}
					return (
						<G key={`y2t-${idx}`}>
							<Line
								x1={width - marginRight}
								y1={y}
								x2={width - marginRight + 4}
								y2={y}
								stroke={COLOR_SECONDARY}
								strokeWidth={1}
							/>
							<SvgText
								x={width - marginRight + 6}
								y={y + 3}
								fill={COLOR_SECONDARY}
								fontSize={9}
							>
								{seriesViews.secondary.formatTick(tick)}
							</SvgText>
						</G>
					);
				})}
		</>
	)
);

/**
 * The orange waypoint markers (dashed vertical lines + numbers), drawn
 * in screen space so strokes, dashes and text stay uniform at any zoom
 * or aspect ratio. Memoized.
 */
const WaypointMarkers = memo(
	({
		markerXs,
		plotH,
		toScreenX,
		toScreenY,
	}: {
		markerXs: number[];
		plotH: number;
		toScreenX: (v: number) => number;
		toScreenY: (v: number) => number;
	}) => (
		<G>
			{markerXs.map((x, idx) => {
				const screenX = toScreenX(x);
				return (
					<G key={`wp-${idx}`}>
						<Line
							x1={screenX}
							y1={toScreenY(0)}
							x2={screenX}
							y2={toScreenY(plotH)}
							stroke={COLOR_WAYPOINT}
							strokeWidth={1}
							strokeDasharray="3,3"
						/>
						<SvgText
							x={screenX + 2}
							y={toScreenY(0) + 12}
							fill={COLOR_WAYPOINT}
							fontSize={10}
						>
							{idx + 1}
						</SvgText>
					</G>
				);
			})}
		</G>
	)
);

/**
 * The blue map-center indicator (vertical/horizontal lines + dots),
 * drawn in screen space so strokes, dashes and dots stay uniform at any
 * zoom or aspect ratio. Memoized: map-center updates only touch this
 * subtree.
 */
const CenterIndicator = memo(
	({
		plotH,
		plotW,
		centerX,
		centerY,
		centerYSecondary,
		marginLeft,
		marginRight,
		width,
		backgroundColor,
		toScreenX,
		toScreenY,
	}: {
		plotH: number;
		plotW: number;
		centerX?: number;
		centerY?: number;
		centerYSecondary?: number;
		marginLeft: number;
		marginRight: number;
		width: number;
		backgroundColor: string;
		toScreenX: (v: number) => number;
		toScreenY: (v: number) => number;
	}) => {
		if (centerX === undefined || centerY === undefined) {
			return null;
		}
		const screenX = toScreenX(centerX);
		const verticalY1 = toScreenY(
			centerYSecondary !== undefined ? Math.min(centerY, centerYSecondary) : centerY
		);
		const verticalY2 = toScreenY(plotH);
		const horizontalY = toScreenY(centerY);
		// Clamp the horizontal line to the plot area: it must stop just
		// right of the blue label (the plot's left edge), never extend
		// under the labels/margins when the viewport is panned or zoomed.
		const horizontalX1 = Math.max(toScreenX(0), marginLeft);
		const horizontalX2 = screenX;
		const secondaryY = centerYSecondary !== undefined ? toScreenY(centerYSecondary) : undefined;
		const secondaryX2 = Math.min(toScreenX(plotW), width - marginRight);

		return (
			<G>
				{/* Background halos keep the indicator readable above area
					fills and ramp colors. */}
				<Line
					x1={screenX}
					y1={verticalY1}
					x2={screenX}
					y2={verticalY2}
					stroke={backgroundColor}
					strokeWidth={3.5}
				/>
				<Line
					x1={horizontalX1}
					y1={horizontalY}
					x2={horizontalX2}
					y2={horizontalY}
					stroke={backgroundColor}
					strokeWidth={3.5}
				/>
				{secondaryY !== undefined && (
					<>
						<Line
							x1={screenX}
							y1={secondaryY}
							x2={secondaryX2}
							y2={secondaryY}
							stroke={backgroundColor}
							strokeWidth={3.5}
						/>
						<Circle
							cx={screenX}
							cy={secondaryY}
							r={4.5}
							fill={backgroundColor}
						/>
					</>
				)}
				<Circle
					cx={screenX}
					cy={horizontalY}
					r={4.5}
					fill={backgroundColor}
				/>

				<Line
					x1={screenX}
					y1={verticalY1}
					x2={screenX}
					y2={verticalY2}
					stroke={COLOR_CENTER}
					strokeWidth={1}
					strokeDasharray="3,3"
				/>
				<Line
					x1={horizontalX1}
					y1={horizontalY}
					x2={horizontalX2}
					y2={horizontalY}
					stroke={COLOR_CENTER}
					strokeWidth={1}
					strokeDasharray="3,3"
				/>
				{secondaryY !== undefined && (
					<>
						<Line
							x1={screenX}
							y1={secondaryY}
							x2={secondaryX2}
							y2={secondaryY}
							stroke={COLOR_CENTER}
							strokeWidth={1}
							strokeDasharray="3,3"
						/>
						<Circle
							cx={screenX}
							cy={secondaryY}
							r={3}
							fill={COLOR_CENTER}
						/>
					</>
				)}
				<Circle
					cx={screenX}
					cy={horizontalY}
					r={3}
					fill={COLOR_CENTER}
				/>
			</G>
		);
	}
);

/**
 * The blue center values at the axes. Memoized — updated independently
 * of the static plot on every map-center change.
 */
const CenterLabels = memo(
	({
		centerX,
		centerY,
		centerYSecondary,
		centerPrimaryLabel,
		centerSecondaryLabel,
		centerDistanceLabel,
		toScreenX,
		toScreenY,
		marginLeft,
		marginRight,
		width,
		height,
	}: {
		centerX?: number;
		centerY?: number;
		centerYSecondary?: number;
		centerPrimaryLabel?: string;
		centerSecondaryLabel?: string;
		centerDistanceLabel?: string;
		toScreenX: (v: number) => number;
		toScreenY: (v: number) => number;
		marginLeft: number;
		marginRight: number;
		width: number;
		height: number;
	}) => {
		if (centerX === undefined || centerY === undefined) {
			return null;
		}
		return (
			<G>
				{centerPrimaryLabel !== undefined && (
					<SvgText
						x={marginLeft - 6}
						y={toScreenY(centerY) + 3}
						fill={COLOR_CENTER}
						fontSize={9}
						textAnchor="end"
					>
						{centerPrimaryLabel}
					</SvgText>
				)}
				{centerYSecondary !== undefined && centerSecondaryLabel !== undefined && (
					<SvgText
						x={width - marginRight + 6}
						y={toScreenY(centerYSecondary) + 3}
						fill={COLOR_CENTER}
						fontSize={9}
					>
						{centerSecondaryLabel}
					</SvgText>
				)}
				{centerDistanceLabel !== undefined && (
					<SvgText
						x={toScreenX(centerX)}
						y={height - MARGIN_BOTTOM + 16}
						fill={COLOR_CENTER}
						fontSize={9}
						textAnchor="middle"
					>
						{centerDistanceLabel}
					</SvgText>
				)}
			</G>
		);
	}
);

const Chart: FC<{
	series: ChartSeries;
	width: number;
	height: number;
	settings: ChartSettings;
	unitPrefs: { [value: string]: UnitPref };
	waypointDistances?: number[];
	centerDistance?: number;
	onRatioChange?: (ratio: number | undefined) => void;
	onRatioUpdate?: (ratio: number | undefined) => void;
	resetSignal?: number;
	followRange?: [number, number];
	followOutOfView?: boolean;
	onUserGesture?: () => void;
	modalOpen?: boolean;
}> = ({
	series,
	width,
	height,
	settings,
	unitPrefs,
	waypointDistances,
	centerDistance,
	onRatioChange,
	onRatioUpdate,
	resetSignal,
	followRange,
	followOutOfView,
	onUserGesture,
	modalOpen = false,
}) => {
	const theme = useTheme();

	const distancePref = useMemo(
		() => unitPrefs.distance ?? { unit: 'metric', round: 1 },
		[unitPrefs]
	);
	const heightPref = useMemo(() => unitPrefs.heightDepth ?? { unit: 'm', round: 0 }, [unitPrefs]);

	const [scaleX, setScaleX] = useState(1);
	const [scaleY, setScaleY] = useState(1);
	const [translateX, setTranslateX] = useState(0);
	const [translateY, setTranslateY] = useState(0);
	// Axis-gesture ratio reporting: bumped on gesture end so the report
	// happens only after the final gesture frame has been committed.
	const [reportTick, setReportTick] = useState(0);
	const pendingAxisReportRef = useRef(false);
	// Follow-map is active until the first user gesture (flipped off
	// synchronously so the follow derivation stops immediately). Re-armed
	// only when follow-map is enabled again — NOT synced from settings on
	// every render (that would undo the flip-off during the gesture's
	// pre-dispatch renders). The center mode needs no such gate: its
	// derivation only re-runs when the center or the x-scale changes.
	const followActiveRef = useRef(settings.followMode === 'map');
	useEffect(() => {
		if (settings.followMode === 'map') {
			followActiveRef.current = true;
		}
	}, [settings.followMode]);
	// Live follow-mode flag for the gesture callbacks — read through a
	// ref so the gesture memo never rebuilds mid-interaction when the
	// mode toggles (a rebuild would restart the in-flight gesture and
	// reset its start snapshot to zero).
	const followModeRef = useRef(settings.followMode);
	followModeRef.current = settings.followMode;

	// Latest state for gesture-start snapshots.
	const scaleXRef = useRef(scaleX);
	const scaleYRef = useRef(scaleY);
	const txRef = useRef(translateX);
	const tyRef = useRef(translateY);
	scaleXRef.current = scaleX;
	scaleYRef.current = scaleY;
	txRef.current = translateX;
	tyRef.current = translateY;

	// ── Domains / plot geometry ─────────────────────────────────────────
	const plotH = Math.max(1, height - MARGIN_TOP - MARGIN_BOTTOM);

	const totalLength = useMemo(() => series.distances[series.distances.length - 1] || 1, [series]);

	// Per-series views: data source, domain, y-mapping, tick formatter.
	const buildSeriesView = useCallback(
		(data: ChartSeriesValue, color: ChartColorMode, axisColor: string): SeriesView => {
			const values =
				data === 'elevation'
					? series.elevations
					: data === 'slope'
						? series.slopes
						: undefined;
			const vmin = values ? Math.min(...values) : 0;
			const vmax = values ? Math.max(...values) : 0;
			const vrange = vmax - vmin || 1;
			return {
				data,
				color,
				axisColor,
				values,
				vmin,
				vmax,
				vrange,
				toY: (v: number) => ((vmax - v) / vrange) * plotH,
				formatTick:
					data === 'slope'
						? (v: number) => `${Math.round(v * 10) / 10}°`
						: (v: number) => formatHeightDepth(v, heightPref),
			};
		},
		[
			series,
			plotH,
			heightPref,
		]
	);

	const seriesViews = useMemo(
		() => ({
			primary: buildSeriesView(settings.primary, settings.primaryColor, COLOR_PRIMARY),
			secondary: buildSeriesView(
				settings.secondary,
				settings.secondaryColor,
				COLOR_SECONDARY
			),
		}),
		[
			buildSeriesView,
			settings.primary,
			settings.primaryColor,
			settings.secondary,
			settings.secondaryColor,
		]
	);

	// Right margin: a compact label gutter while the secondary axis is
	// visible, a small inset aligned with the header otherwise.
	const marginRight = seriesViews.secondary.values ? MARGIN_RIGHT : MARGIN_FALLBACK;
	// Left margin: full label gutter while the primary axis is visible,
	// a small inset aligned with the header otherwise.
	const marginLeft = seriesViews.primary.values ? MARGIN_LEFT : MARGIN_FALLBACK;
	const plotW = Math.max(1, width - marginLeft - marginRight);

	const distToX = useCallback((d: number) => (d / totalLength) * plotW, [totalLength, plotW]);

	// ── Ratio (aspect ratio) handling ───────────────────────────────────
	// The ratio is (visible x-range) / (visible y-range of the primary
	// The ratio is always per-chart: the y-scale is derived from the
	// x-scale so the aspect stays pinned to the stored value.
	const ratioK = useMemo(() => {
		if (!settings.ratioValue || !seriesViews.primary.values) {
			return undefined;
		}
		return (settings.ratioValue * seriesViews.primary.vrange) / totalLength;
	}, [
		settings.ratioValue,
		seriesViews,
		totalLength,
	]);

	// Effective y-scale: an independent state; follows the ratio when
	// set, otherwise stays where the user (or follow-mode) left it.
	const syEff = scaleY;

	// Current ratio, reported to the parent (modal snapshot).
	const currentRatio = useMemo(
		() =>
			seriesViews.primary.values
				? totalLength / scaleX / (seriesViews.primary.vrange / syEff)
				: undefined,
		[
			seriesViews.primary.values,
			seriesViews.primary.vrange,
			totalLength,
			scaleX,
			syEff,
		]
	);

	useEffect(() => {
		onRatioChange && onRatioChange(currentRatio);
	}, [
		currentRatio,
		onRatioChange,
	]);

	// Report the axis gesture's ratio once the final viewport frame is
	// committed (the tick render follows the last gesture setState).
	useEffect(() => {
		if (!pendingAxisReportRef.current) {
			return;
		}
		pendingAxisReportRef.current = false;
		if (currentRatio !== undefined && onRatioUpdate) {
			onRatioUpdate(currentRatio);
		}
	}, [
		reportTick,
		currentRatio,
		onRatioUpdate,
	]);

	// ── Ratio application ────────────────────────────────────────────────
	// The ratio is applied by scaling X (the y-scale stays where the user
	// left it). While the settings modal is open the apply is deferred to
	// the modal closing; otherwise it applies immediately.
	const plotWRef = useRef(plotW);
	const plotHRef = useRef(plotH);
	plotWRef.current = plotW;
	plotHRef.current = plotH;

	// ── Follow-mode animation (eased viewport writes) ───────────────────
	// The follow-derived viewport glides toward its target (exponential
	// smoothing, frame-capped) instead of jumping per map event. All
	// other viewport writers cancel a pending glide first so they can
	// never fight the loop.
	const followAnimIdRef = useRef<number | undefined>(undefined);
	const followLastFrameRef = useRef(0);

	const cancelFollowAnimation = useCallback(() => {
		if (followAnimIdRef.current !== undefined) {
			cancelAnimationFrame(followAnimIdRef.current);
			followAnimIdRef.current = undefined;
		}
	}, []);

	const animateViewportTo = useCallback(
		(target: { sx: number; tx: number; ty: number }) => {
			cancelFollowAnimation();
			// Force an immediate first step so a fresh target starts
			// moving right away.
			followLastFrameRef.current = 0;
			const step = () => {
				followAnimIdRef.current = undefined;
				const sx = smoothValue(scaleXRef.current, target.sx, FOLLOW_SMOOTHING);
				const tx = clampTranslate(
					plotWRef.current,
					sx,
					smoothValue(txRef.current, target.tx, FOLLOW_SMOOTHING)
				);
				const ty = smoothValue(tyRef.current, target.ty, FOLLOW_SMOOTHING);
				const done =
					Math.abs(target.sx - sx) < FOLLOW_SNAP_SCALE &&
					Math.abs(target.tx - tx) < FOLLOW_SNAP_TX_PX &&
					Math.abs(target.ty - ty) < FOLLOW_SNAP_TX_PX;
				if (done) {
					// Snap to the exact target and stop.
					if (sx !== scaleXRef.current) {
						setScaleX(target.sx);
					}
					if (tx !== txRef.current) {
						setTranslateX(target.tx);
					}
					if (ty !== tyRef.current) {
						setTranslateY(target.ty);
					}
					return;
				}
				const now = Date.now();
				if (now - followLastFrameRef.current >= FOLLOW_FRAME_MS) {
					followLastFrameRef.current = now;
					setScaleX(sx);
					setTranslateX(tx);
					setTranslateY(ty);
				}
				followAnimIdRef.current = requestAnimationFrame(step);
			};
			followAnimIdRef.current = requestAnimationFrame(step);
		},
		[cancelFollowAnimation]
	);
	const pendingRatioApplyRef = useRef(false);
	const prevRatioKRef = useRef(ratioK);

	const applyRatioNow = useCallback(() => {
		if (ratioK === undefined) {
			return;
		}
		cancelFollowAnimation();
		const sx = clamp(scaleYRef.current / ratioK, MIN_SCALE, MAX_SCALE);
		const sy = clamp(scaleYRef.current, MIN_SCALE, MAX_SCALE);
		const tx = clampTranslate(plotWRef.current, sx, txRef.current);
		const ty = clampTranslate(plotHRef.current, sy, tyRef.current);
		if (
			sx !== scaleXRef.current ||
			sy !== scaleYRef.current ||
			tx !== txRef.current ||
			ty !== tyRef.current
		) {
			setScaleX(sx);
			setScaleY(sy);
			setTranslateX(tx);
			setTranslateY(ty);
		}
	}, [
		ratioK,
		cancelFollowAnimation,
	]);

	useEffect(() => {
		const ratioKChanged = prevRatioKRef.current !== ratioK;
		prevRatioKRef.current = ratioK;
		if (!ratioKChanged) {
			// Modal open/close alone must not re-apply the stored ratio.
			return;
		}
		if (modalOpen) {
			pendingRatioApplyRef.current = true;
			return;
		}
		applyRatioNow();
	}, [
		ratioK,
		modalOpen,
		applyRatioNow,
	]);

	useEffect(() => {
		if (!modalOpen && pendingRatioApplyRef.current) {
			pendingRatioApplyRef.current = false;
			applyRatioNow();
		}
	}, [
		modalOpen,
		applyRatioNow,
	]);

	// Layout resize: clamp the current viewport to the new bounds without
	// touching the stored ratio (a keyboard-driven resize must not re-apply
	// an old ratio).
	useEffect(() => {
		cancelFollowAnimation();
		const sx = clamp(scaleXRef.current, MIN_SCALE, MAX_SCALE);
		const sy = clamp(scaleYRef.current, MIN_SCALE, MAX_SCALE);
		const tx = clampTranslate(plotW, sx, txRef.current);
		const ty = clampTranslate(plotH, sy, tyRef.current);
		if (
			sx !== scaleXRef.current ||
			sy !== scaleYRef.current ||
			tx !== txRef.current ||
			ty !== tyRef.current
		) {
			setScaleX(sx);
			setScaleY(sy);
			setTranslateX(tx);
			setTranslateY(ty);
		}
	}, [
		plotW,
		plotH,
		cancelFollowAnimation,
	]);

	// Fit-screen / chart switch: reset the viewport to fit, then apply
	// the stored ratio on the x-scale when one is set. Reads the ratio
	// through a ref so it only fires on reset-signal changes (not on every
	// typed ratio value).
	const ratioKRef = useRef(ratioK);
	ratioKRef.current = ratioK;
	useEffect(() => {
		if (resetSignal === undefined) {
			return;
		}
		cancelFollowAnimation();
		const k = ratioKRef.current;
		setScaleX(k !== undefined ? clamp(1 / k, MIN_SCALE, MAX_SCALE) : 1);
		setScaleY(1);
		setTranslateX(0);
		setTranslateY(0);
	}, [
		resetSignal,
		cancelFollowAnimation,
	]);

	// Follow-map: the viewport's x-window is the map-covered route range
	// (1:1), the y-scale stays as-is, and the view scrolls vertically to
	// keep the center indicator in view. Gated on followActiveRef so a
	// just-started gesture stops the overwrites immediately (no jump).
	// The derived viewport is eased instead of written directly.
	useEffect(() => {
		if (!followActiveRef.current || settings.followMode !== 'map' || !followRange) {
			cancelFollowAnimation();
			return;
		}
		const [d0, d1] = followRange;
		const span = d1 - d0 || 1;
		const sx = clamp(totalLength / span, MIN_SCALE, MAX_SCALE);
		const sy = clamp(scaleYRef.current, MIN_SCALE, MAX_SCALE);
		const tx = clampTranslate(plotW, sx, (-d0 * plotW) / span);
		const centerIdx =
			centerDistance !== undefined
				? nearestIndex(series.distances, centerDistance)
				: undefined;
		const centerYPlot =
			centerIdx !== undefined && seriesViews.primary.values
				? seriesViews.primary.toY(
						seriesViews.primary.values[centerIdx] ?? seriesViews.primary.vmax
					)
				: undefined;
		const ty =
			centerYPlot !== undefined
				? clampTranslate(plotH, sy, plotH / 2 - sy * centerYPlot)
				: undefined;
		if (sy !== scaleYRef.current) {
			setScaleY(sy);
		}
		if (
			sx !== scaleXRef.current ||
			tx !== txRef.current ||
			(ty !== undefined && ty !== tyRef.current)
		) {
			animateViewportTo({ sx, tx, ty: ty ?? tyRef.current });
		}
		return cancelFollowAnimation;
	}, [
		settings.followMode,
		followRange,
		totalLength,
		plotW,
		plotH,
		centerDistance,
		series,
		seriesViews,
		animateViewportTo,
		cancelFollowAnimation,
	]);

	// Follow-center: the map center stays in the chart's horizontal
	// middle (clamped to the plot edges at the route ends). The scale and
	// the y-viewport are left alone — only the x-translation is derived,
	// and it is eased so the chart glides instead of jumping. Re-running
	// on scaleX changes re-centers the chart after x-zooms (smoothly)
	// without resetting the mode.
	useEffect(() => {
		if (settings.followMode !== 'center' || centerDistance === undefined) {
			cancelFollowAnimation();
			return;
		}
		const tx = clampTranslate(plotW, scaleX, plotW / 2 - scaleX * distToX(centerDistance));
		if (tx !== txRef.current) {
			animateViewportTo({ sx: scaleX, tx, ty: tyRef.current });
		}
		return cancelFollowAnimation;
	}, [
		settings.followMode,
		centerDistance,
		scaleX,
		plotW,
		distToX,
		animateViewportTo,
		cancelFollowAnimation,
	]);

	// ── Paths (memoized — only depend on the series) ────────────────────
	const pathData = useMemo(() => {
		const xs = series.distances.map(distToX);
		const ysFor = (view: SeriesView) => (view.values ? view.values.map(view.toY) : undefined);
		return {
			xs,
			ysPrimary: ysFor(seriesViews.primary),
			ysSecondary: ysFor(seriesViews.secondary),
		};
	}, [
		series,
		distToX,
		seriesViews,
	]);

	const paths = useMemo(
		() => ({
			primary: pathData.ysPrimary ? buildPathD(pathData.xs, pathData.ysPrimary) : '',
			secondary: pathData.ysSecondary ? buildPathD(pathData.xs, pathData.ysSecondary) : '',
		}),
		[pathData]
	);

	// Elevation domain for the elevation ramp (independent of the series
	// views — the color modes reference data fields, not series).
	const elevationDomain = useMemo(() => {
		const vmin = Math.min(...series.elevations);
		const vmax = Math.max(...series.elevations);
		return { vmin, vmax };
	}, [series]);

	// Ramp coloring for a series view: batched color runs along the view's
	// path, colored by the values of the chosen data field (elevation or
	// slope) — independent of which series the view is.
	const colorRunsFor = useCallback(
		(view: SeriesView): ColorRun[] => {
			const ys = view === seriesViews.primary ? pathData.ysPrimary : pathData.ysSecondary;
			if (view.color === 'axis' || !view.values || !ys) {
				return [];
			}
			const isSlope = view.color === 'slope' || view.color === 'slopeFill';
			const values = isSlope ? series.slopes : series.elevations;
			const colorForValue = isSlope
				? slopeToColor
				: (v: number) => elevationToColor(v, elevationDomain.vmin, elevationDomain.vmax);
			return buildColorRuns(pathData.xs, ys, values, colorForValue);
		},
		[
			pathData,
			seriesViews,
			series,
			elevationDomain,
		]
	);

	const primaryRuns = useMemo(
		() => colorRunsFor(seriesViews.primary),
		[
			colorRunsFor,
			seriesViews.primary,
		]
	);
	const secondaryRuns = useMemo(
		() => colorRunsFor(seriesViews.secondary),
		[
			colorRunsFor,
			seriesViews.secondary,
		]
	);

	// Quantized viewport values for the heavy memos: color-run
	// simplification and ticks recompute at most per grid step, so the
	// eased follow writes (30fps) don't re-derive them every frame. The
	// animated values keep full precision for the plot transform and the
	// screen-space overlays.
	const txQ = Math.round(translateX / QUANTIZE_TX_PX) * QUANTIZE_TX_PX;
	const tyQ = Math.round(translateY / QUANTIZE_TX_PX) * QUANTIZE_TX_PX;
	const sxQ = Math.round(scaleX * QUANTIZE_SCALE_STEPS) / QUANTIZE_SCALE_STEPS;

	// Adaptive simplification: keep only the visible runs and merge
	// sub-pixel ones so the rendered node count stays bounded at any
	// zoom level. Exact per-segment colors remain wherever segments are
	// at least a pixel wide.
	const simplifyRuns = useCallback(
		(runs: ColorRun[]): ColorRun[] =>
			simplifyColorRuns(runs, sxQ, -txQ / sxQ, (plotW - txQ) / sxQ),
		[
			sxQ,
			txQ,
			plotW,
		]
	);
	const primaryRenderRuns = useMemo(
		() => simplifyRuns(primaryRuns),
		[
			simplifyRuns,
			primaryRuns,
		]
	);
	const secondaryRenderRuns = useMemo(
		() => simplifyRuns(secondaryRuns),
		[
			simplifyRuns,
			secondaryRuns,
		]
	);

	// Area fills (fill color modes): closed polygons per color run,
	// dropping from the line down to the x-axis (plot y = plotH). The
	// stroke uses the same (simplified) runs as the fill.
	const fillRunsFor = useCallback(
		(view: SeriesView): { color: string; d: string }[] => {
			if (view.color !== 'elevationFill' && view.color !== 'slopeFill') {
				return [];
			}
			const runs = view === seriesViews.primary ? primaryRenderRuns : secondaryRenderRuns;
			return runs.map((run) => ({
				color: run.color,
				d: `${run.d} L ${run.x1} ${plotH} L ${run.x0} ${plotH} Z`,
			}));
		},
		[
			seriesViews,
			primaryRenderRuns,
			secondaryRenderRuns,
			plotH,
		]
	);

	const primaryFillRuns = useMemo(
		() => fillRunsFor(seriesViews.primary),
		[
			fillRunsFor,
			seriesViews.primary,
		]
	);
	const secondaryFillRuns = useMemo(
		() => fillRunsFor(seriesViews.secondary),
		[
			fillRunsFor,
			seriesViews.secondary,
		]
	);

	// ── Viewport-derived ticks (quantized window — see txQ/tyQ/sxQ) ─────
	const ticks = useMemo(() => {
		const d0 = ((-txQ / sxQ) * totalLength) / plotW;
		const d1 = (((plotW - txQ) / sxQ) * totalLength) / plotW;
		const xTicks = getNiceTicks(d0, d1, 5);

		const yTicksFor = (view: SeriesView): number[] => {
			if (!view.values) {
				return [];
			}
			const v0 = view.vmax - (((plotH - tyQ) / syEff) * view.vrange) / plotH;
			const v1 = view.vmax - ((-tyQ / syEff) * view.vrange) / plotH;
			return getNiceTicks(Math.min(v0, v1), Math.max(v0, v1), 4);
		};
		return {
			xTicks,
			y1Ticks: yTicksFor(seriesViews.primary),
			y2Ticks: yTicksFor(seriesViews.secondary),
		};
	}, [
		txQ,
		tyQ,
		sxQ,
		syEff,
		totalLength,
		plotW,
		plotH,
		seriesViews,
	]);

	const toScreenX = useCallback(
		(v: number) => marginLeft + translateX + scaleX * v,
		[
			translateX,
			scaleX,
			marginLeft,
		]
	);
	const toScreenY = useCallback(
		(v: number) => MARGIN_TOP + translateY + syEff * v,
		[translateY, syEff]
	);
	// Quantized screen-space transforms for PlotAxes: stable between
	// grid steps so transform-only animation frames keep the memo (and
	// its path elements) bailing out.
	const toScreenXQ = useCallback(
		(v: number) => marginLeft + txQ + sxQ * v,
		[
			marginLeft,
			txQ,
			sxQ,
		]
	);
	const toScreenYQ = useCallback((v: number) => MARGIN_TOP + tyQ + syEff * v, [tyQ, syEff]);

	// ── Gestures (JS-driven state — small subtree, labels stay in sync) ──
	// All math runs off gesture-start snapshots (not live state), so scale
	// is never compounded across events and pan never fights the pinch.
	// The pinch region (plot / x-axis band / y-axis column) is classified
	// once at gesture start from the focal point — no per-view overlays.
	const gesture = useMemo(() => {
		const panStartRef = { tx: 0, ty: 0 };
		const pinchBaseRef: { base: PinchBase } = {
			base: { sx: 1, sy: 1, tx: 0, ty: 0, focalX: 0, focalY: 0 },
		};
		const pinchRegionRef: { region: 'uniform' | 'x' } = { region: 'uniform' };
		const pinchTouchesRef: { current: { x: number; y: number }[] } = { current: [] };

		const applyTransform = (sx: number, sy: number, tx: number, ty: number) => {
			setScaleX(sx);
			setScaleY(sy);
			setTranslateX(tx);
			setTranslateY(ty);
		};

		const classifyRegionFromTouches = (
			t0: { x: number; y: number },
			t1: { x: number; y: number }
		): 'uniform' | 'x' => {
			const focalY = (t0.y + t1.y) / 2;
			if (focalY > height - MARGIN_BOTTOM - X_AXIS_BAND_OVERLAP) {
				return 'x';
			}
			return 'uniform';
		};

		// A user gesture on a follow mode switches the option off — the
		// gesture then continues from the current viewport (the stored
		// ratio is never re-applied on this reset). In the center mode
		// only a pan switches the option off; zoom gestures are
		// compatible with centering and re-center instead.
		const notifyUserGesture = () => {
			followActiveRef.current = false;
			// Stop a pending follow glide synchronously — the gesture
			// takes over the viewport from the current state.
			cancelFollowAnimation();
			if (followModeRef.current !== 'none' && onUserGesture) {
				onUserGesture();
			}
		};
		const notifyUserGestureIfMap = () => {
			if (followModeRef.current === 'map') {
				notifyUserGesture();
			}
		};

		// One-finger pan: never fires while two fingers pinch.
		const pan = Gesture.Pan()
			.minDistance(4)
			.maxPointers(1)
			.runOnJS(true)
			.onStart(() => {
				notifyUserGesture();
				panStartRef.tx = txRef.current;
				panStartRef.ty = tyRef.current;
			})
			.onUpdate((event) => {
				setTranslateX(
					clampTranslate(plotW, scaleXRef.current, panStartRef.tx + event.translationX)
				);
				setTranslateY(
					clampTranslate(plotH, scaleYRef.current, panStartRef.ty + event.translationY)
				);
			});

		// Two-finger pinch: snapshot the base once, derive everything from
		// it. Re-snapshot and re-classify whenever a finger changes
		// (Android re-touch quirk).
		const snapshotPinchBase = (touches: { x: number; y: number }[]) => {
			const [t0, t1] = touches;
			pinchBaseRef.base = {
				sx: scaleXRef.current,
				sy: scaleYRef.current,
				tx: txRef.current,
				ty: tyRef.current,
				focalX: (t0.x + t1.x) / 2 - marginLeft,
				focalY: (t0.y + t1.y) / 2 - MARGIN_TOP,
				dx: Math.abs(t1.x - t0.x),
			};
		};

		const pinch = Gesture.Pinch()
			.runOnJS(true)
			.onStart((event) => {
				notifyUserGestureIfMap();
				const touches = pinchTouchesRef.current;
				if (touches.length >= 2) {
					snapshotPinchBase(touches.slice(0, 2));
				} else {
					const base: PinchBase = {
						sx: scaleXRef.current,
						sy: scaleYRef.current,
						tx: txRef.current,
						ty: tyRef.current,
						focalX: event.focalX - marginLeft,
						focalY: event.focalY - MARGIN_TOP,
					};
					pinchBaseRef.base = base;
				}
			})
			.onTouchesDown((event) => {
				const touches = (event.allTouches ?? []).map((t) => ({ x: t.x, y: t.y }));
				pinchTouchesRef.current = touches;
				if (touches.length < 2) {
					return;
				}
				pinchRegionRef.region = classifyRegionFromTouches(touches[0], touches[1]);
				snapshotPinchBase(touches.slice(0, 2));
			})
			.onTouchesMove((event) => {
				pinchTouchesRef.current = (event.allTouches ?? []).map((t) => ({
					x: t.x,
					y: t.y,
				}));
			})
			.onUpdate((event) => {
				const { base } = pinchBaseRef;
				const region = pinchRegionRef.region;
				let sx: number;
				let sy: number;
				if (region === 'x') {
					const touches = pinchTouchesRef.current;
					const perAxis =
						touches.length >= 2 && base.dx && base.dx >= MIN_AXIS_SEPARATION
							? clamp(
									Math.abs(touches[1].x - touches[0].x) / base.dx,
									1 / MAX_SCALE,
									MAX_SCALE
								)
							: undefined;
					const factor = perAxis ?? event.scale;
					sx = clamp(base.sx * factor, MIN_SCALE, MAX_SCALE);
					sy = base.sy;
				} else {
					sx = clamp(base.sx * event.scale, MIN_SCALE, MAX_SCALE);
					sy = clamp(base.sy * event.scale, MIN_SCALE, MAX_SCALE);
				}
				const kx = sx / base.sx;
				const ky = sy / base.sy;
				// In the center mode the x-translation is owned by the
				// centering effect (which re-runs on the scaleX change) —
				// zoom gestures must not write it.
				const isCenter = followModeRef.current === 'center';
				applyTransform(
					sx,
					sy,
					isCenter
						? txRef.current
						: clampTranslate(plotW, sx, base.focalX - kx * (base.focalX - base.tx)),
					clampTranslate(plotH, sy, base.focalY - ky * (base.focalY - base.ty))
				);
			})
			.onEnd(() => {
				if (pinchRegionRef.region !== 'uniform') {
					// Report the ratio after the final gesture frame has been
					// committed (the tick render follows the last setState).
					pendingAxisReportRef.current = true;
					setReportTick((t) => t + 1);
				}
				pinchRegionRef.region = 'uniform';
			});

		const doubleTap = Gesture.Tap()
			.numberOfTaps(2)
			.runOnJS(true)
			.onEnd((event) => {
				notifyUserGestureIfMap();
				const base: PinchBase = {
					sx: scaleXRef.current,
					sy: scaleYRef.current,
					tx: txRef.current,
					ty: tyRef.current,
					focalX: event.x - marginLeft,
					focalY: event.y - MARGIN_TOP,
				};
				const sx = clamp(base.sx * 2, MIN_SCALE, MAX_SCALE);
				const sy = clamp(base.sy * 2, MIN_SCALE, MAX_SCALE);
				const kx = sx / base.sx;
				const ky = sy / base.sy;
				const isCenter = followModeRef.current === 'center';
				applyTransform(
					sx,
					sy,
					isCenter
						? txRef.current
						: clampTranslate(plotW, sx, base.focalX - kx * (base.focalX - base.tx)),
					clampTranslate(plotH, sy, base.focalY - ky * (base.focalY - base.ty))
				);
			});

		return Gesture.Simultaneous(pan, pinch, doubleTap);
	}, [
		plotW,
		plotH,
		marginLeft,
		height,
		onUserGesture,
		cancelFollowAnimation,
	]);

	const markerXs = useMemo(
		() => (waypointDistances ?? []).map((d) => distToX(d)).filter((x) => x >= 0 && x <= plotW),
		[
			waypointDistances,
			distToX,
			plotW,
		]
	);
	const centerX = useMemo(
		() => (centerDistance !== undefined ? distToX(centerDistance) : undefined),
		[centerDistance, distToX]
	);
	const centerIdx = useMemo(
		() =>
			centerDistance !== undefined
				? nearestIndex(series.distances, centerDistance)
				: undefined,
		[
			centerDistance,
			series,
		]
	);
	const centerY = useMemo(
		() =>
			centerIdx !== undefined && seriesViews.primary.values
				? seriesViews.primary.toY(
						seriesViews.primary.values[centerIdx] ?? seriesViews.primary.vmax
					)
				: undefined,
		[
			centerIdx,
			seriesViews,
		]
	);
	const centerYSecondary = useMemo(
		() =>
			centerIdx !== undefined && seriesViews.secondary.values
				? seriesViews.secondary.toY(
						seriesViews.secondary.values[centerIdx] ?? seriesViews.secondary.vmax
					)
				: undefined,
		[
			centerIdx,
			seriesViews,
		]
	);
	const centerPrimaryLabel = useMemo(
		() =>
			centerIdx !== undefined && seriesViews.primary.values
				? seriesViews.primary.formatTick(
						seriesViews.primary.values[centerIdx] ?? seriesViews.primary.vmax
					)
				: undefined,
		[
			centerIdx,
			seriesViews,
		]
	);
	const centerSecondaryLabel = useMemo(
		() =>
			centerIdx !== undefined && seriesViews.secondary.values
				? seriesViews.secondary.formatTick(
						seriesViews.secondary.values[centerIdx] ?? seriesViews.secondary.vmax
					)
				: undefined,
		[
			centerIdx,
			seriesViews,
		]
	);
	const centerDistanceLabel = useMemo(
		() =>
			centerDistance !== undefined ? formatDistance(centerDistance, distancePref) : undefined,
		[
			centerDistance,
			distancePref,
		]
	);

	const groupTransform = `translate(${translateX}, ${translateY}) scale(${scaleX}, ${syEff})`;

	if (followOutOfView) {
		// Follow-map with the visible map panned away from the route —
		// render an empty plot (no lines, axes, ticks or indicators).
		return (
			<GestureDetector gesture={gesture}>
				<View style={styles.container} />
			</GestureDetector>
		);
	}

	return (
		<GestureDetector gesture={gesture}>
			<View style={styles.container}>
				<Svg
					width={width}
					height={height}
				>
					{/* Plot content (pan/zoom) — the animated transform lives
						out here so pure-translation frames don't invalidate
						the PlotContent memo. */}
					<G
						x={marginLeft}
						y={MARGIN_TOP}
						transform={groupTransform}
					>
						<PlotContent
							seriesViews={seriesViews}
							primaryRenderRuns={primaryRenderRuns}
							secondaryRenderRuns={secondaryRenderRuns}
							primaryFillRuns={primaryFillRuns}
							secondaryFillRuns={secondaryFillRuns}
							paths={paths}
						/>
					</G>

					{/* Axes and tick labels (screen space — never transformed) */}
					<PlotAxes
						seriesViews={seriesViews}
						ticks={ticks}
						width={width}
						height={height}
						marginLeft={marginLeft}
						marginRight={marginRight}
						distancePref={distancePref}
						theme={theme}
						distToX={distToX}
						toScreenX={toScreenXQ}
						toScreenY={toScreenYQ}
					/>

					<WaypointMarkers
						markerXs={markerXs}
						plotH={plotH}
						toScreenX={toScreenX}
						toScreenY={toScreenY}
					/>

					{/* The center indicator must always be the uppermost layer
						— keep this group last in the Svg so nothing can paint
						over the blue lines, dots or labels. */}
					<G>
						<CenterIndicator
							plotH={plotH}
							plotW={plotW}
							centerX={centerX}
							centerY={centerY}
							centerYSecondary={centerYSecondary}
							marginLeft={marginLeft}
							marginRight={marginRight}
							width={width}
							backgroundColor={theme.colors.background}
							toScreenX={toScreenX}
							toScreenY={toScreenY}
						/>

						<CenterLabels
							centerX={centerX}
							centerY={centerY}
							centerYSecondary={centerYSecondary}
							centerPrimaryLabel={centerPrimaryLabel}
							centerSecondaryLabel={centerSecondaryLabel}
							centerDistanceLabel={centerDistanceLabel}
							toScreenX={toScreenX}
							toScreenY={toScreenY}
							marginLeft={marginLeft}
							marginRight={marginRight}
							width={width}
							height={height}
						/>
					</G>
				</Svg>
			</View>
		</GestureDetector>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});

export default Chart;
