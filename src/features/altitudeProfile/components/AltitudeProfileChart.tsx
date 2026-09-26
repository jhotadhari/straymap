/**
 * External dependencies
 */
import React, { FC, useCallback, useMemo, useRef, useState } from 'react';
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
	ViewportTransform,
	clampTranslate,
	zoomAroundPoint,
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
const MARGIN_RIGHT = 44;
const MARGIN_TOP = 10;
const MARGIN_BOTTOM = 26;

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

const AltitudeProfileChart: FC<{
	series: ProfileSeries;
	width: number;
	height: number;
	settings: ProfileSettings;
	unitPrefs: { [value: string]: UnitPref };
	waypointDistances?: number[];
	centerDistance?: number;
}> = ({ series, width, height, settings, unitPrefs, waypointDistances, centerDistance }) => {
	const theme = useTheme();

	const distancePref = useMemo(
		() => unitPrefs.distance ?? { unit: 'metric', round: 1 },
		[unitPrefs]
	);
	const heightPref = useMemo(() => unitPrefs.heightDepth ?? { unit: 'm', round: 0 }, [unitPrefs]);

	const [scale, setScale] = useState(1);
	const [translateX, setTranslateX] = useState(0);
	const [translateY, setTranslateY] = useState(0);

	// Latest state for gesture-start snapshots.
	const scaleRef = useRef(scale);
	const txRef = useRef(translateX);
	const tyRef = useRef(translateY);
	scaleRef.current = scale;
	txRef.current = translateX;
	tyRef.current = translateY;

	// ── Domains / plot geometry ─────────────────────────────────────────
	const plotW = Math.max(1, width - MARGIN_LEFT - MARGIN_RIGHT);
	const plotH = Math.max(1, height - MARGIN_TOP - MARGIN_BOTTOM);

	const totalLength = useMemo(() => series.distances[series.distances.length - 1] || 1, [series]);

	const distToX = useCallback((d: number) => (d / totalLength) * plotW, [totalLength, plotW]);

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
		const d0 = ((-translateX / scale) * totalLength) / plotW;
		const d1 = (((plotW - translateX) / scale) * totalLength) / plotW;
		const xTicks = getNiceTicks(d0, d1, 5);

		const yTicksFor = (view: SeriesView): number[] => {
			if (!view.values) {
				return [];
			}
			const v0 = view.vmax - (((plotH - translateY) / scale) * view.vrange) / plotH;
			const v1 = view.vmax - ((-translateY / scale) * view.vrange) / plotH;
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
		scale,
		totalLength,
		plotW,
		plotH,
		seriesViews,
	]);

	const toScreenX = useCallback(
		(v: number) => MARGIN_LEFT + translateX + scale * v,
		[translateX, scale]
	);
	const toScreenY = useCallback(
		(v: number) => MARGIN_TOP + translateY + scale * v,
		[translateY, scale]
	);

	// ── Gestures (JS-driven state — small subtree, labels stay in sync) ──
	// All math runs off gesture-start snapshots (not live state), so scale
	// is never compounded across events and pan never fights the pinch.
	const gesture = useMemo(() => {
		const panStartRef = { tx: 0, ty: 0 };
		const pinchBaseRef: { base: ViewportTransform; focal: { x: number; y: number } } = {
			base: { scale: 1, translateX: 0, translateY: 0 },
			focal: { x: 0, y: 0 },
		};

		const applyTransform = (next: ViewportTransform) => {
			setScale(next.scale);
			setTranslateX(next.translateX);
			setTranslateY(next.translateY);
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
					clampTranslate(plotW, scaleRef.current, panStartRef.tx + event.translationX)
				);
				setTranslateY(
					clampTranslate(plotH, scaleRef.current, panStartRef.ty + event.translationY)
				);
			});

		// Two-finger pinch: snapshot the base once, derive everything from
		// it. Re-snapshot whenever a finger changes (Android re-touch quirk).
		const snapshotPinchBase = (focalX: number, focalY: number) => {
			pinchBaseRef.base = {
				scale: scaleRef.current,
				translateX: txRef.current,
				translateY: tyRef.current,
			};
			pinchBaseRef.focal = { x: focalX - MARGIN_LEFT, y: focalY - MARGIN_TOP };
		};

		const pinch = Gesture.Pinch()
			.runOnJS(true)
			.onStart((event) => {
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
				const { base, focal } = pinchBaseRef;
				applyTransform(
					zoomAroundPoint(
						base,
						focal,
						base.scale * event.scale,
						{ width: plotW, height: plotH },
						MAX_SCALE
					)
				);
			});

		const doubleTap = Gesture.Tap()
			.numberOfTaps(2)
			.runOnJS(true)
			.onEnd((event) => {
				const base: ViewportTransform = {
					scale: scaleRef.current,
					translateX: txRef.current,
					translateY: tyRef.current,
				};
				applyTransform(
					zoomAroundPoint(
						base,
						{ x: event.x - MARGIN_LEFT, y: event.y - MARGIN_TOP },
						base.scale * 2,
						{ width: plotW, height: plotH },
						MAX_SCALE
					)
				);
			});

		return Gesture.Simultaneous(pan, pinch, doubleTap);
	}, [plotW, plotH]);

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

	const groupTransform = `translate(${translateX}, ${translateY}) scale(${scale})`;

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
					strokeWidth={strokeWidth / scale}
					opacity={blendOpacity}
					fill="none"
				/>
			));
		}
		return (
			<Path
				d={pathD}
				stroke={view.axisColor}
				strokeWidth={strokeWidth / scale}
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
						x={MARGIN_LEFT}
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
									strokeWidth={1 / scale}
									strokeDasharray={`${3 / scale},${3 / scale}`}
								/>
								<SvgText
									x={x + 2 / scale}
									y={10 / scale}
									fill={COLOR_WAYPOINT}
									fontSize={10 / scale}
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
									strokeWidth={1 / scale}
									strokeDasharray={`${3 / scale},${3 / scale}`}
								/>
								<Circle
									cx={centerX}
									cy={centerY}
									r={3 / scale}
									fill={COLOR_CENTER}
								/>
							</G>
						)}
					</G>

					{/* Axes (static) */}
					<Line
						x1={MARGIN_LEFT}
						y1={height - MARGIN_BOTTOM}
						x2={width - MARGIN_RIGHT}
						y2={height - MARGIN_BOTTOM}
						stroke={theme.colors.outline}
						strokeWidth={1}
					/>
					{ticks.xTicks.map((tick, idx) => {
						const x = toScreenX(distToX(tick));
						if (x < MARGIN_LEFT - 1 || x > width - MARGIN_RIGHT + 1) {
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
										x1={MARGIN_LEFT}
										y1={y}
										x2={MARGIN_LEFT - 4}
										y2={y}
										stroke={COLOR_PRIMARY}
										strokeWidth={1}
									/>
									<SvgText
										x={MARGIN_LEFT - 6}
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
										x1={width - MARGIN_RIGHT}
										y1={y}
										x2={width - MARGIN_RIGHT + 4}
										y2={y}
										stroke={COLOR_SECONDARY}
										strokeWidth={1}
									/>
									<SvgText
										x={width - MARGIN_RIGHT + 6}
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
