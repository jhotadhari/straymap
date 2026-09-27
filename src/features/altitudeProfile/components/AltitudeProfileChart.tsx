/**
 * External dependencies
 */
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTheme } from 'react-native-paper';

/**
 * Internal dependencies
 */
import {
	buildColorRuns,
	elevationToColor,
	getNiceTicks,
	ProfileSeries,
	slopeToColor,
	clampTranslate,
} from '../utils';
import { ProfileColorMode, ProfileSeriesValue, ProfileSettings } from '../types';
import { formatDistance, formatHeightDepth } from '../../../lib/formatting';
import { UnitPref } from '../../general/types';

const COLOR_PRIMARY = '#E53935';
const COLOR_SECONDARY = '#43A047';
const COLOR_CENTER = '#1A73E8';
const COLOR_WAYPOINT = '#F57C00';

const MAX_SCALE = 20;
const MARGIN_LEFT = 44;
const MARGIN_RIGHT = 40;
const MARGIN_FALLBACK = 8;
const MARGIN_TOP = 10;
const MARGIN_BOTTOM = 26;
const X_AXIS_BAND_OVERLAP = 12;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const nearestIndex = (distances: number[], target: number): number => {
	let best = 0;
	let bestDiff = Infinity;
	for (let i = 0; i < distances.length; i++) {
		const diff = Math.abs(distances[i] - target);
		if (diff < bestDiff) {
			bestDiff = diff;
			best = i;
		}
	}
	return best;
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
	data: ProfileSeriesValue;
	color: ProfileColorMode;
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
}

const AltitudeProfileChart: FC<{
	series: ProfileSeries;
	width: number;
	height: number;
	settings: ProfileSettings;
	unitPrefs: { [value: string]: UnitPref };
	waypointDistances?: number[];
	centerDistance?: number;
	onRatioChange?: (ratio: number | undefined) => void;
	onRatioUpdate?: (ratio: number | undefined) => void;
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
		(data: ProfileSeriesValue, color: ProfileColorMode, axisColor: string): SeriesView => {
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
	// axis). In 'fixed' mode the y-scale is derived from the x-scale so
	// the ratio stays pinned to the user's value; in 'auto' mode both axes
	// share one scale (the data's natural ratio).
	const ratioK = useMemo(() => {
		if (settings.ratioMode !== 'fixed' || !settings.ratioValue || !seriesViews.primary.values) {
			return undefined;
		}
		return (settings.ratioValue * seriesViews.primary.vrange) / totalLength;
	}, [
		settings.ratioMode,
		settings.ratioValue,
		seriesViews,
		totalLength,
	]);

	// Effective y-scale: derived from the x-scale in auto mode, an
	// independent state (stretchable via the axis gestures) in fixed mode.
	const isFixed = settings.ratioMode === 'fixed';
	const syEff = isFixed ? scaleY : scaleX;

	// Current ratio, reported to the parent (modal snapshot).
	const currentRatio = seriesViews.primary.values
		? totalLength / scaleX / (seriesViews.primary.vrange / syEff)
		: undefined;

	useEffect(() => {
		onRatioChange && onRatioChange(currentRatio);
	}, [
		currentRatio,
		onRatioChange,
	]);

	// Re-validate the viewport whenever the ratio settings change — no
	// gesture required. Switching back to auto resets to fit. Keyed on the
	// settings/plot geometry only (refs for the values) so it never fights
	// an in-flight gesture.
	const prevRatioModeRef = useRef(settings.ratioMode);
	useEffect(() => {
		const modeChanged = prevRatioModeRef.current !== settings.ratioMode;
		prevRatioModeRef.current = settings.ratioMode;
		if (modeChanged && settings.ratioMode === 'auto') {
			setScaleX(1);
			setScaleY(1);
			setTranslateX(0);
			setTranslateY(0);
			return;
		}
		const sx = clamp(scaleXRef.current, 1, MAX_SCALE);
		const sy =
			ratioK !== undefined
				? clamp(sx * ratioK, 1, MAX_SCALE)
				: clamp(scaleYRef.current, 1, MAX_SCALE);
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
		settings.ratioMode,
		ratioK,
		plotW,
		plotH,
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

	// Color source series for a color mode ('primary' / 'secondary').
	const colorSourceFor = useCallback(
		(mode: ProfileColorMode): SeriesView | undefined =>
			mode === 'primary'
				? seriesViews.primary
				: mode === 'secondary'
					? seriesViews.secondary
					: undefined,
		[seriesViews]
	);

	// Ramp coloring for a series view: batched color runs along the view's
	// path, colored by the values of the chosen source series.
	const colorRunsFor = useCallback(
		(view: SeriesView): { color: string; d: string }[] => {
			const source = colorSourceFor(view.color);
			const ys = view === seriesViews.primary ? pathData.ysPrimary : pathData.ysSecondary;
			if (view.color === 'axis' || !view.values || !ys || !source?.values) {
				return [];
			}
			const colorForValue =
				source.data === 'slope'
					? slopeToColor
					: (v: number) => elevationToColor(v, source.vmin, source.vmax);
			return buildColorRuns(pathData.xs, ys, source.values, colorForValue);
		},
		[
			colorSourceFor,
			pathData,
			seriesViews,
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

	// Blend colors: semi-transparent series strokes so crossings show a
	// mixed color (only meaningful while both series are visible).
	const blendOpacity =
		settings.blendColors && seriesViews.primary.values && seriesViews.secondary.values
			? 0.65
			: 1;

	// ── Viewport-derived ticks ──────────────────────────────────────────
	const ticks = useMemo(() => {
		const d0 = ((-translateX / scaleX) * totalLength) / plotW;
		const d1 = (((plotW - translateX) / scaleX) * totalLength) / plotW;
		const xTicks = getNiceTicks(d0, d1, 5);

		const yTicksFor = (view: SeriesView): number[] => {
			if (!view.values) {
				return [];
			}
			const v0 = view.vmax - (((plotH - translateY) / syEff) * view.vrange) / plotH;
			const v1 = view.vmax - ((-translateY / syEff) * view.vrange) / plotH;
			return getNiceTicks(Math.min(v0, v1), Math.max(v0, v1), 4);
		};
		return {
			xTicks,
			y1Ticks: yTicksFor(seriesViews.primary),
			y2Ticks: yTicksFor(seriesViews.secondary),
		};
	}, [
		translateX,
		translateY,
		scaleX,
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

	// ── Gestures (JS-driven state — small subtree, labels stay in sync) ──
	// All math runs off gesture-start snapshots (not live state), so scale
	// is never compounded across events and pan never fights the pinch.
	// The pinch region (plot / x-axis band / y-axis column) is classified
	// once at gesture start from the focal point — no per-view overlays.
	const reportRatio = useCallback(() => {
		if (!onRatioUpdate || !seriesViews.primary.values) {
			return;
		}
		onRatioUpdate(
			(totalLength * scaleYRef.current) / (seriesViews.primary.vrange * scaleXRef.current)
		);
	}, [
		onRatioUpdate,
		seriesViews,
		totalLength,
	]);

	const gesture = useMemo(() => {
		const panStartRef = { tx: 0, ty: 0 };
		const pinchBaseRef: { base: PinchBase } = {
			base: { sx: 1, sy: 1, tx: 0, ty: 0, focalX: 0, focalY: 0 },
		};
		const pinchRegionRef: { region: 'uniform' | 'x' | 'y' } = { region: 'uniform' };

		const applyTransform = (sx: number, sy: number, tx: number, ty: number) => {
			setScaleX(sx);
			setScaleY(sy);
			setTranslateX(tx);
			setTranslateY(ty);
		};

		const classifyRegion = (focalX: number, focalY: number): 'uniform' | 'x' | 'y' => {
			if (!isFixed) {
				return 'uniform';
			}
			if (focalX < marginLeft) {
				return 'y';
			}
			if (focalY > height - MARGIN_BOTTOM - X_AXIS_BAND_OVERLAP) {
				return 'x';
			}
			return 'uniform';
		};

		// One-finger pan: never fires while two fingers pinch.
		const pan = Gesture.Pan()
			.minDistance(4)
			.maxPointers(1)
			.runOnJS(true)
			.onStart(() => {
				panStartRef.tx = txRef.current;
				panStartRef.ty = tyRef.current;
			})
			.onUpdate((event) => {
				setTranslateX(
					clampTranslate(plotW, scaleXRef.current, panStartRef.tx + event.translationX)
				);
				setTranslateY(
					clampTranslate(
						plotH,
						isFixed ? scaleYRef.current : scaleXRef.current,
						panStartRef.ty + event.translationY
					)
				);
			});

		// Two-finger pinch: snapshot the base once, derive everything from
		// it. Re-snapshot whenever a finger changes (Android re-touch quirk).
		const snapshotPinchBase = (focalX: number, focalY: number) => {
			pinchBaseRef.base = {
				sx: scaleXRef.current,
				sy: isFixed ? scaleYRef.current : scaleXRef.current,
				tx: txRef.current,
				ty: tyRef.current,
				focalX: focalX - marginLeft,
				focalY: focalY - MARGIN_TOP,
			};
		};

		const pinch = Gesture.Pinch()
			.runOnJS(true)
			.onStart((event) => {
				pinchRegionRef.region = classifyRegion(event.focalX, event.focalY);
				snapshotPinchBase(event.focalX, event.focalY);
			})
			.onTouchesDown((event) => {
				const touches = event.allTouches ?? [];
				if (touches.length < 2) {
					return;
				}
				const [t0, t1] = touches;
				snapshotPinchBase((t0.x + t1.x) / 2, (t0.y + t1.y) / 2);
			})
			.onUpdate((event) => {
				const { base } = pinchBaseRef;
				const region = pinchRegionRef.region;
				let sx: number;
				let sy: number;
				if (region === 'x') {
					sx = clamp(base.sx * event.scale, 1, MAX_SCALE);
					sy = base.sy;
				} else if (region === 'y') {
					sx = base.sx;
					sy = clamp(base.sy * event.scale, 1, MAX_SCALE);
				} else if (isFixed) {
					sx = clamp(base.sx * event.scale, 1, MAX_SCALE);
					sy = clamp(base.sy * event.scale, 1, MAX_SCALE);
				} else {
					sx = clamp(base.sx * event.scale, 1, MAX_SCALE);
					sy = sx;
				}
				const kx = sx / base.sx;
				const ky = sy / base.sy;
				applyTransform(
					sx,
					sy,
					clampTranslate(plotW, sx, base.focalX - kx * (base.focalX - base.tx)),
					clampTranslate(plotH, sy, base.focalY - ky * (base.focalY - base.ty))
				);
			})
			.onEnd(() => {
				if (pinchRegionRef.region !== 'uniform') {
					reportRatio();
				}
			});

		const doubleTap = Gesture.Tap()
			.numberOfTaps(2)
			.runOnJS(true)
			.onEnd((event) => {
				const base: PinchBase = {
					sx: scaleXRef.current,
					sy: isFixed ? scaleYRef.current : scaleXRef.current,
					tx: txRef.current,
					ty: tyRef.current,
					focalX: event.x - marginLeft,
					focalY: event.y - MARGIN_TOP,
				};
				const sx = clamp(base.sx * 2, 1, MAX_SCALE);
				const sy = isFixed ? clamp(base.sy * 2, 1, MAX_SCALE) : sx;
				const kx = sx / base.sx;
				const ky = sy / base.sy;
				applyTransform(
					sx,
					sy,
					clampTranslate(plotW, sx, base.focalX - kx * (base.focalX - base.tx)),
					clampTranslate(plotH, sy, base.focalY - ky * (base.focalY - base.ty))
				);
			});

		return Gesture.Simultaneous(pan, pinch, doubleTap);
	}, [
		plotW,
		plotH,
		marginLeft,
		height,
		isFixed,
		reportRatio,
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
	const centerY = useMemo(
		() =>
			centerDistance !== undefined && seriesViews.primary.values
				? seriesViews.primary.toY(
						seriesViews.primary.values[
							nearestIndex(series.distances, centerDistance)
						] ?? seriesViews.primary.vmax
					)
				: undefined,
		[
			centerDistance,
			series,
			seriesViews,
		]
	);

	const groupTransform = `translate(${translateX}, ${translateY}) scale(${scaleX}, ${syEff})`;

	// Stroke/marker sizes divide by the larger scale so nothing thickens
	// when the plot is stretched.
	const sizeScale = Math.max(scaleX, syEff);

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
					strokeWidth={strokeWidth / sizeScale}
					opacity={blendOpacity}
					fill="none"
				/>
			));
		}
		return (
			<Path
				d={pathD}
				stroke={view.axisColor}
				strokeWidth={strokeWidth / sizeScale}
				opacity={blendOpacity}
				fill="none"
			/>
		);
	};

	return (
		<GestureDetector gesture={gesture}>
			<View style={styles.container}>
				<Svg
					width={width}
					height={height}
				>
					{/* Plot content (pan/zoom) */}
					<G
						x={marginLeft}
						y={MARGIN_TOP}
						transform={groupTransform}
					>
						{/* Secondary series first — the primary always draws above it. */}
						{renderSeries(seriesViews.secondary, secondaryRuns, paths.secondary, 1.5)}

						{renderSeries(seriesViews.primary, primaryRuns, paths.primary, 2)}

						{markerXs.map((x, idx) => (
							<G key={`wp-${idx}`}>
								<Line
									x1={x}
									y1={0}
									x2={x}
									y2={plotH}
									stroke={COLOR_WAYPOINT}
									strokeWidth={1 / sizeScale}
									strokeDasharray={`${3 / sizeScale},${3 / sizeScale}`}
								/>
								<SvgText
									x={x + 2 / sizeScale}
									y={10 / sizeScale}
									fill={COLOR_WAYPOINT}
									fontSize={10 / sizeScale}
								>
									{idx + 1}
								</SvgText>
							</G>
						))}

						{centerX !== undefined && centerY !== undefined && (
							<G>
								<Line
									x1={centerX}
									y1={0}
									x2={centerX}
									y2={plotH}
									stroke={COLOR_CENTER}
									strokeWidth={1 / sizeScale}
									strokeDasharray={`${3 / sizeScale},${3 / sizeScale}`}
								/>
								<Circle
									cx={centerX}
									cy={centerY}
									r={3 / sizeScale}
									fill={COLOR_CENTER}
								/>
							</G>
						)}
					</G>

					{/* Axes (static) */}
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

export default AltitudeProfileChart;
