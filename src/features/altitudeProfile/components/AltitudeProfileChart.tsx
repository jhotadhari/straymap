/**
 * External dependencies
 */
import React, { FC, useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
	Circle,
	Defs,
	G,
	Line,
	LinearGradient,
	Path,
	Rect,
	Stop,
	Text as SvgText,
} from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTheme } from 'react-native-paper';
import { interpolateColor } from 'react-native-mapsforge-vtm-ext-path-color-ramp';

/**
 * Internal dependencies
 */
import { getNiceTicks, ProfileSeries } from '../utils';
import { ProfileSettings } from '../types';
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

// Slope ramp stops in degrees (percent stops converted, like the map ramp).
const SLOPE_STOPS = [
	{ value: -11.31, color: '#00004d' },
	{ value: -7.41, color: '#000080' },
	{ value: -4, color: '#0000ff' },
	{ value: -1.15, color: '#00e8ff' },
	{ value: 0, color: '#00ff00' },
	{ value: 1.15, color: '#FFDE02' },
	{ value: 4, color: '#ff0000' },
	{ value: 7.41, color: '#800000' },
	{ value: 11.31, color: '#4d0000' },
];

const slopeToColor = (slope: number): string => {
	const min = SLOPE_STOPS[0].value;
	const max = SLOPE_STOPS[SLOPE_STOPS.length - 1].value;
	const v = clamp(slope, min, max);
	for (let i = 0; i < SLOPE_STOPS.length - 1; i++) {
		const a = SLOPE_STOPS[i];
		const b = SLOPE_STOPS[i + 1];
		if (v >= a.value && v <= b.value) {
			const t = (v - a.value) / (b.value - a.value || 1);
			return interpolateColor(a.color, b.color, t);
		}
	}
	return SLOPE_STOPS[SLOPE_STOPS.length - 1].color;
};

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
	const yMin = Math.min(...series.elevations);
	const yMax = Math.max(...series.elevations);
	const yRange = yMax - yMin || 1;
	const slopeMin = Math.min(...series.slopes);
	const slopeMax = Math.max(...series.slopes);
	const slopeRange = slopeMax - slopeMin || 1;

	// Plot-local coordinates (0..plotW / 0..plotH).
	const distToX = useCallback((d: number) => (d / totalLength) * plotW, [totalLength, plotW]);
	const elevToY = useCallback(
		(e: number) => ((yMax - e) / yRange) * plotH,
		[
			yMax,
			yRange,
			plotH,
		]
	);
	const slopeToY = useCallback(
		(s: number) => ((slopeMax - s) / slopeRange) * plotH,
		[
			slopeMax,
			slopeRange,
			plotH,
		]
	);

	// ── Paths (memoized — only depend on the series) ────────────────────
	const pathData = useMemo(() => {
		const xs = series.distances.map(distToX);
		const ysElev = series.elevations.map(elevToY);
		const ysSlope = series.slopes.map(slopeToY);
		const primaryD = buildPathD(xs, ysElev);
		const areaD = primaryD
			? `${primaryD} L ${xs[xs.length - 1]} ${plotH} L ${xs[0]} ${plotH} Z`
			: '';
		return {
			primaryD,
			areaD,
			secondaryD: buildPathD(xs, ysSlope),
			xs,
			ysElev,
		};
	}, [
		series,
		distToX,
		elevToY,
		slopeToY,
		plotH,
	]);

	// Slope coloring: quantized buckets, batched into color-run paths.
	const slopeRuns = useMemo(() => {
		if (settings.colorMode !== 'slope') {
			return [];
		}
		const min = SLOPE_STOPS[0].value;
		const max = SLOPE_STOPS[SLOPE_STOPS.length - 1].value;
		const bucketCount = 12;
		const bucketColor = (slope: number) => {
			const idx = clamp(
				Math.round(((clamp(slope, min, max) - min) / (max - min)) * (bucketCount - 1)),
				0,
				bucketCount - 1
			);
			const bucketValue = min + ((max - min) * idx) / (bucketCount - 1);
			return slopeToColor(bucketValue);
		};

		const runs: { color: string; d: string }[] = [];
		let currentColor = '';
		let currentD = '';
		for (let i = 0; i < pathData.xs.length - 1; i++) {
			const color = bucketColor(series.slopes[i]);
			const seg = `M ${pathData.xs[i]} ${pathData.ysElev[i]} L ${pathData.xs[i + 1]} ${pathData.ysElev[i + 1]} `;
			if (color === currentColor) {
				currentD += seg;
			} else {
				if (currentD) {
					runs.push({ color: currentColor, d: currentD });
				}
				currentColor = color;
				currentD = seg;
			}
		}
		if (currentD) {
			runs.push({ color: currentColor, d: currentD });
		}
		return runs;
	}, [
		settings.colorMode,
		pathData,
		series.slopes,
	]);

	// ── Viewport-derived ticks ──────────────────────────────────────────
	const ticks = useMemo(() => {
		const d0 = ((-translateX / scale) * totalLength) / plotW;
		const d1 = (((plotW - translateX) / scale) * totalLength) / plotW;
		const xTicks = getNiceTicks(d0, d1, 5);

		const e0 = yMax - (((plotH - translateY) / scale) * yRange) / plotH;
		const e1 = yMax - ((-translateY / scale) * yRange) / plotH;
		const y1Ticks = getNiceTicks(Math.min(e0, e1), Math.max(e0, e1), 4);

		const s0 = slopeMax - (((plotH - translateY) / scale) * slopeRange) / plotH;
		const s1 = slopeMax - ((-translateY / scale) * slopeRange) / plotH;
		const y2Ticks = getNiceTicks(Math.min(s0, s1), Math.max(s0, s1), 4);
		return { xTicks, y1Ticks, y2Ticks };
	}, [
		translateX,
		translateY,
		scale,
		totalLength,
		plotW,
		plotH,
		yMax,
		yRange,
		slopeMax,
		slopeRange,
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
	const gesture = useMemo(() => {
		const clampTx = (s: number, v: number) => clamp(v, Math.min(0, plotW * (1 - s)), 0);
		const clampTy = (s: number, v: number) => clamp(v, Math.min(0, plotH * (1 - s)), 0);

		const zoomAround = (focalX: number, focalY: number, newScale: number) => {
			const s = clamp(newScale, 1, MAX_SCALE);
			const fx = focalX - MARGIN_LEFT;
			const fy = focalY - MARGIN_TOP;
			return {
				tx: clampTx(s, fx - (s * (fx - txRef.current)) / scaleRef.current),
				ty: clampTy(s, fy - (s * (fy - tyRef.current)) / scaleRef.current),
			};
		};

		const pan = Gesture.Pan()
			.minDistance(4)
			.runOnJS(true)
			.onUpdate((event) => {
				setTranslateX(clampTx(scaleRef.current, txRef.current + event.translationX));
				setTranslateY(clampTy(scaleRef.current, tyRef.current + event.translationY));
			});

		const pinch = Gesture.Pinch()
			.runOnJS(true)
			.onUpdate((event) => {
				const s = clamp(scaleRef.current * event.scale, 1, MAX_SCALE);
				const next = zoomAround(event.focalX, event.focalY, s);
				setScale(s);
				setTranslateX(next.tx);
				setTranslateY(next.ty);
			});

		const doubleTap = Gesture.Tap()
			.numberOfTaps(2)
			.runOnJS(true)
			.onEnd((event) => {
				const s = clamp(scaleRef.current * 2, 1, MAX_SCALE);
				const next = zoomAround(event.x, event.y, s);
				setScale(s);
				setTranslateX(next.tx);
				setTranslateY(next.ty);
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
			centerDistance !== undefined
				? elevToY(series.elevations[nearestIndex(series.distances, centerDistance)] ?? yMax)
				: undefined,
		[
			centerDistance,
			series,
			elevToY,
			yMax,
		]
	);

	const groupTransform = `translate(${translateX}, ${translateY}) scale(${scale})`;

	return (
		<GestureDetector gesture={gesture}>
			<View style={styles.container}>
				<Svg
					width={width}
					height={height}
				>
					<Defs>
						<LinearGradient
							id="areaGradient"
							x1="0"
							y1="0"
							x2="0"
							y2="1"
						>
							<Stop
								offset="0"
								stopColor={COLOR_PRIMARY}
								stopOpacity="0.35"
							/>
							<Stop
								offset="1"
								stopColor={COLOR_PRIMARY}
								stopOpacity="0"
							/>
						</LinearGradient>
					</Defs>

					{/* Plot content (pan/zoom) */}
					<G
						x={MARGIN_LEFT}
						y={MARGIN_TOP}
						transform={groupTransform}
					>
						<Rect
							x={0}
							y={0}
							width={plotW}
							height={plotH}
							fill={theme.colors.surfaceVariant}
							opacity={0.4}
						/>

						{settings.colorMode === 'axis' && pathData.areaD && (
							<Path
								d={pathData.areaD}
								fill="url(#areaGradient)"
							/>
						)}

						{settings.colorMode === 'slope' &&
							slopeRuns.map((run, idx) => (
								<Path
									key={idx}
									d={run.d}
									stroke={run.color}
									strokeWidth={2}
									fill="none"
								/>
							))}

						{settings.colorMode === 'axis' && pathData.primaryD && (
							<Path
								d={pathData.primaryD}
								stroke={COLOR_PRIMARY}
								strokeWidth={2}
								fill="none"
							/>
						)}

						{settings.secondary === 'slope' && pathData.secondaryD && (
							<Path
								d={pathData.secondaryD}
								stroke={COLOR_SECONDARY}
								strokeWidth={1.5}
								fill="none"
							/>
						)}

						{markerXs.map((x, idx) => (
							<G key={`wp-${idx}`}>
								<Line
									x1={x}
									y1={0}
									x2={x}
									y2={plotH}
									stroke={COLOR_WAYPOINT}
									strokeWidth={1}
									strokeDasharray="3,3"
								/>
								<SvgText
									x={x + 2}
									y={10}
									fill={COLOR_WAYPOINT}
									fontSize={10}
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
									strokeWidth={1}
									strokeDasharray="3,3"
								/>
								<Circle
									cx={centerX}
									cy={centerY}
									r={3}
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

					{ticks.y1Ticks.map((tick, idx) => {
						const y = toScreenY(elevToY(tick));
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
									{formatHeightDepth(tick, heightPref)}
								</SvgText>
							</G>
						);
					})}

					{settings.secondary === 'slope' &&
						ticks.y2Ticks.map((tick, idx) => {
							const y = toScreenY(slopeToY(tick));
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
										{`${Math.round(tick * 10) / 10}°`}
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
