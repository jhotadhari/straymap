/**
 * External dependencies
 */
import React, { FC, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, TouchableHighlight, View } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { bbox as turfBbox } from '@turf/turf';

/**
 * Internal dependencies
 */
import BottomDrawerContext from '../../bottomDrawer/BottomDrawerContext';
import BottomDrawerMenu from '../../bottomDrawer/components/BottomDrawerMenu';
import { useBottomDrawerMenuOptions } from '../../bottomDrawer/hooks/useBottomDrawerMenuOptions';
import { AppContext, MapContext } from '../../../Context';
import ButtonHighlight from '../../../components/generic/primitives/ButtonHighlight';
import IconButtonHighlight from '../../../components/generic/primitives/IconButtonHighlight';
import { MAP_ANIMATION_PADDING_PX } from '../../../constants';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { selectPathCoords } from '../../routing/selectors';
import { selectMapUpdateInterval, selectUnitPrefs } from '../../general/selectors';
import { queryLinePathCoords, queryLinesWithoutGeom } from '../../lines/db/queryFns';
import { haversineDistance } from '../../../lib/formatting';
import LineStats from '../../lines/components/Stats/LineStats';
import { RenderPart } from '../../lines/components/Stats/sharedDeps';
import { LinePartial } from '../../lines/types';
import useRoute from '../../routing/hooks/useRoute';
import { getChartSourceFromKey } from '../types';
import { selectChartSettings } from '../selectors';
import { setChartSettings } from '../slice';
import { useChartItemLabels } from '../hooks/useChartItemLabels';
import { getChartSeries } from '../utils';
import Chart from './Chart';
import ChartSettingsModal from './ChartSettingsModal/ChartSettingsModal';
import { computeViewportBbox, useMap } from 'react-native-mapsforge-vtm';

const statsRenderParts = ['icon', 'value'] as RenderPart[];
const statsRenderPartsNoIcon = ['value'] as RenderPart[];

const nearestDistance = (
	coordinates: number[][],
	distances: number[],
	target: [number, number]
): number => {
	let bestIdx = 0;
	let bestDist = Infinity;
	for (let i = 0; i < coordinates.length; i++) {
		const d = haversineDistance([coordinates[i][0], coordinates[i][1]], target);
		if (d < bestDist) {
			bestDist = d;
			bestIdx = i;
		}
	}
	return distances[bestIdx];
};

/**
 * Distances along the route that fall inside the given geographic bbox
 * ([west, south, east, north]) — the covered route segment.
 */
const getCoveredRange = (
	coordinates: number[][],
	distances: number[],
	bbox: [
		number,
		number,
		number,
		number,
	]
): [number, number] | undefined => {
	const [
		west,
		south,
		east,
		north,
	] = bbox;
	let first: number | undefined;
	let last: number | undefined;
	for (let i = 0; i < coordinates.length; i++) {
		const [lng, lat] = coordinates[i];
		if (lng >= west && lng <= east && lat >= south && lat <= north) {
			if (first === undefined) {
				first = distances[i];
			}
			last = distances[i];
		}
	}
	return first !== undefined && last !== undefined && last > first ? [first, last] : undefined;
};

const ChartDisplay: FC = () => {
	const theme = useTheme();
	const { t } = useTranslation();

	const { activeItemKey, settingsModalVisible, setSettingsModalVisible } =
		useContext(BottomDrawerContext);
	const { currentMapEventRef } = useContext(MapContext);
	const { mapViewNativeNodeHandle } = useContext(AppContext);
	const { flyToBounds } = useMap(mapViewNativeNodeHandle);

	const source = useMemo(() => getChartSourceFromKey(activeItemKey), [activeItemKey]);
	const chartLabels = useChartItemLabels();

	const routingCoords = useAppSelector(selectPathCoords);
	const lineId = source?.type === 'line' ? source.lineId : undefined;
	const { data: lineCoords } = useQuery({
		queryKey: ['linePathCoords', lineId],
		queryFn: queryLinePathCoords,
		enabled: lineId !== undefined,
	});

	// DB (SpatiaLite) stats for the line — the same values every other
	// LineStats usage shows for this route.
	const { data: line } = useQuery({
		queryKey: ['lines', lineId !== undefined ? [lineId] : []],
		queryFn: queryLinesWithoutGeom,
		enabled: lineId !== undefined,
		select: (lines: LinePartial[]) => (lines.length ? lines[0] : null),
	});

	const coordinates: number[][] | undefined =
		source?.type === 'routing' ? routingCoords : (lineCoords ?? undefined);

	const unitPrefs = useAppSelector(selectUnitPrefs);
	const mapUpdateInterval = useAppSelector(selectMapUpdateInterval);
	const settings = useAppSelector((state) => selectChartSettings(state, activeItemKey));
	const dispatch = useAppDispatch();

	// Axis gesture settles a new fixed ratio — always written to the
	// active chart.s own entry (the ratio is always per-chart).
	const handleRatioUpdate = useCallback(
		(ratio: number | undefined) => {
			if (ratio == null || !activeItemKey) {
				return;
			}
			dispatch(setChartSettings({ key: activeItemKey, settings: { ratioValue: ratio } }));
		},
		[
			dispatch,
			activeItemKey,
		]
	);

	const series = useMemo(
		() => (coordinates ? getChartSeries(coordinates) : undefined),
		[coordinates]
	);

	const label = useMemo(
		() => (activeItemKey ? (chartLabels[activeItemKey] ?? activeItemKey) : ''),
		[activeItemKey, chartLabels]
	);

	// Routing waypoints and stats (routing source only). route.stats is
	// computed from the routed line's geometry with the same SpatiaLite
	// functions as the lines table.
	const { points, stats: routeStats } = useRoute(['points', 'stats']) || {};
	const waypointDistances = useMemo(() => {
		if (!coordinates || !series || source?.type !== 'routing' || !points?.length) {
			return undefined;
		}
		return points.map((p) =>
			nearestDistance(coordinates, series.distances, [
				p.geometry.coordinates[0],
				p.geometry.coordinates[1],
			])
		);
	}, [
		coordinates,
		series,
		source,
		points,
	]);

	const stats = useMemo(() => {
		const rawStats = source?.type === 'line' ? line?.stats : routeStats;
		const { length, ...rest } = rawStats ?? {};
		return { length, rest };
	}, [
		source?.type,
		line?.stats,
		routeStats,
	]);

	const hasStats = stats.length != null || Object.keys(stats.rest).length > 0;

	// The natural "fit" ratio (total distance per primary-axis unit) —
	// used by the modal's Fit-screen button.
	const fitRatio = useMemo(() => {
		if (!series) {
			return undefined;
		}
		const values = settings.primary === 'slope' ? series.slopes : series.elevations;
		const vmin = Math.min(...values);
		const vmax = Math.max(...values);
		const total = series.distances[series.distances.length - 1] || 0;
		return total / (vmax - vmin || 1);
	}, [
		series,
		settings.primary,
	]);

	// Viewport reset signal (Fit-screen button + chart switches).
	const [resetSignal, setResetSignal] = useState(0);
	const handleFitScreen = useCallback(() => {
		setResetSignal((t) => t + 1);
	}, []);
	useEffect(() => {
		setResetSignal((t) => t + 1);
	}, [activeItemKey]);

	// A user gesture on the chart switches the follow-map toggle off.
	const handleUserGesture = useCallback(() => {
		if (!activeItemKey) {
			return;
		}
		dispatch(setChartSettings({ key: activeItemKey, settings: { followMap: false } }));
	}, [
		dispatch,
		activeItemKey,
	]);

	// Fly the map to the route (shown while following with the map panned
	// away from it). The follow derivation re-syncs the chart while the
	// map animates.
	const handleFlyToRoute = useCallback(() => {
		if (!mapViewNativeNodeHandle) {
			return;
		}
		const bbox =
			source?.type === 'line'
				? line?.envelope
					? turfBbox(line.envelope)
					: undefined
				: coordinates && coordinates.length
					? turfBbox({ type: 'LineString', coordinates })
					: undefined;
		if (bbox) {
			flyToBounds(bbox, { paddingPx: MAP_ANIMATION_PADDING_PX });
		}
	}, [
		mapViewNativeNodeHandle,
		flyToBounds,
		source?.type,
		line?.envelope,
		coordinates,
	]);

	// Covered route range (follow-map): the map's visible bbox mapped onto
	// the route's distance axis. Frozen (kept) when there is no
	// intersection or no map event data. `followOutOfView` is true while
	// following and the visible map has no overlap with the route (the
	// chart then renders no lines and shows the Fly-to-route button).
	const [followRange, setFollowRange] = useState<[number, number] | undefined>(undefined);
	const [followOutOfView, setFollowOutOfView] = useState(false);

	useEffect(() => {
		if (!settings.followMap) {
			setFollowOutOfView(false);
		}
	}, [settings.followMap]);

	// Center indicator: poll the map center (same cadence as the map events).
	const [center, setCenter] = useState<[number, number] | undefined>(undefined);
	const prevCenterRef = useRef<[number, number] | undefined>(undefined);
	useEffect(() => {
		const interval = setInterval(() => {
			const ev = currentMapEventRef.current;
			const next: [number, number] | undefined = ev?.center
				? [ev.center[0], ev.center[1]]
				: undefined;
			const prev = prevCenterRef.current;
			if (
				next &&
				(!prev || Math.abs(prev[0] - next[0]) > 1e-6 || Math.abs(prev[1] - next[1]) > 1e-6)
			) {
				prevCenterRef.current = next;
				setCenter(next);
			}
			if (
				settings.followMap &&
				ev?.center &&
				typeof ev.zoomLevel === 'number' &&
				typeof ev.viewportWidth === 'number' &&
				typeof ev.viewportHeight === 'number' &&
				coordinates &&
				series
			) {
				const bbox = computeViewportBbox(
					[ev.center[0], ev.center[1]],
					ev.zoomLevel,
					ev.viewportWidth,
					ev.viewportHeight,
					ev.bearing ?? 0,
					ev.tilt ?? 0
				);
				if (bbox) {
					const range = getCoveredRange(coordinates, series.distances, bbox);
					if (range) {
						setFollowRange(range);
						setFollowOutOfView(false);
					} else {
						setFollowOutOfView(true);
					}
				}
			}
		}, mapUpdateInterval);
		return () => clearInterval(interval);
	}, [
		currentMapEventRef,
		mapUpdateInterval,
		settings.followMap,
		coordinates,
		series,
	]);

	const centerDistance = useMemo(
		() =>
			coordinates && series && center
				? nearestDistance(coordinates, series.distances, center)
				: undefined,
		[
			coordinates,
			series,
			center,
		]
	);

	const [chartSize, setChartSize] = useState<{ width: number; height: number }>({
		width: 0,
		height: 0,
	});
	const handleChartLayout = useCallback((event: LayoutChangeEvent) => {
		const { width: w, height: h } = event.nativeEvent.layout;
		if (w && h) {
			setChartSize({ width: w, height: h });
		}
	}, []);

	// Title menu: switch the active bottom drawer item (replaces the
	// handle's long-press menu).
	const [menuVisible, setMenuVisible] = useState(false);
	const titleAnchorRef = useRef<View>(null);
	const menuOptions = useBottomDrawerMenuOptions();

	// Current chart aspect ratio: the chart reports every viewport change
	// into a ref (no per-frame re-renders); the settings modal snapshots it
	// when opened (the chart can't be zoomed while the modal is open).
	const ratioRef = useRef<number | undefined>(undefined);
	const handleRatioChange = useCallback(
		(ratio: number | undefined) => {
			ratioRef.current = ratio;
			// Keep the modal's ratio field live while it is open (and not
			// following — the field is hidden then).
			if (settingsModalVisible && !settings.followMap) {
				setCurrentRatio(ratio);
			}
		},
		[
			settingsModalVisible,
			settings.followMap,
		]
	);
	const [currentRatio, setCurrentRatio] = useState<number | undefined>(undefined);
	const handleOpenSettings = useCallback(() => {
		setCurrentRatio(ratioRef.current);
		setSettingsModalVisible(true);
	}, [setSettingsModalVisible]);

	// Keep the modal's ratio snapshot fresh: the chart's ratio changes
	// while follow-map is active (and on chart switches), but the modal
	// only snapshots it when opened.
	useEffect(() => {
		setCurrentRatio(ratioRef.current);
	}, [
		settings.followMap,
		activeItemKey,
	]);

	if (!series) {
		return (
			<View style={styles.container}>
				<Text style={[styles.text, { color: theme.colors.onBackground }]}>…</Text>
			</View>
		);
	}

	const { showLabel, showStats } = settings;

	const statsNode = hasStats && showStats && (
		<View style={styles.statsRow}>
			{stats.length != null && (
				<LineStats
					stats={{ length: stats.length }}
					renderParts={statsRenderPartsNoIcon}
				/>
			)}
			<LineStats
				stats={stats.rest}
				renderParts={statsRenderParts}
			/>
		</View>
	);

	return (
		<View style={styles.container}>
			<View style={showLabel || showStats ? styles.header : styles.headerAbs}>
				{showLabel && (
					<View
						ref={titleAnchorRef}
						collapsable={false}
						style={styles.titleAnchorWrap}
					>
						<TouchableHighlight
							underlayColor={theme.colors.elevation.level3}
							onPress={() => setMenuVisible(true)}
						>
							<View style={styles.titleAnchor}>
								<Text
									style={[styles.title, { color: theme.colors.onBackground }]}
									numberOfLines={1}
								>
									{label}
								</Text>
								<Icon
									source="chevron-down"
									size={16}
									color={theme.colors.onSurfaceVariant}
								/>
							</View>
						</TouchableHighlight>
					</View>
				)}
				{!showLabel && statsNode}
				<IconButtonHighlight
					icon="cog"
					onPress={handleOpenSettings}
				/>
			</View>

			{showLabel && <View style={styles.header}>{statsNode}</View>}

			<View
				style={styles.chartWrap}
				onLayout={handleChartLayout}
			>
				{chartSize.width > 0 && chartSize.height > 0 && (
					<Chart
						series={series}
						width={chartSize.width}
						height={chartSize.height}
						settings={settings}
						unitPrefs={unitPrefs}
						waypointDistances={waypointDistances}
						centerDistance={centerDistance}
						onRatioChange={handleRatioChange}
						onRatioUpdate={handleRatioUpdate}
						resetSignal={resetSignal}
						followRange={settings.followMap ? followRange : undefined}
						followOutOfView={settings.followMap ? followOutOfView : false}
						onUserGesture={handleUserGesture}
						modalOpen={settingsModalVisible}
					/>
				)}
				{settings.followMap && followOutOfView && (
					<View
						style={styles.flyToWrap}
						pointerEvents="box-none"
					>
						<ButtonHighlight
							mode="outlined"
							compact={true}
							icon="image-filter-center-focus-strong-outline"
							onPress={handleFlyToRoute}
						>
							{t('chart.flyTo')}
						</ButtonHighlight>
					</View>
				)}
			</View>

			<ChartSettingsModal
				visible={settingsModalVisible}
				setVisible={setSettingsModalVisible}
				chartKey={activeItemKey ?? ''}
				currentRatio={currentRatio}
				fitRatio={fitRatio}
				onFitScreen={handleFitScreen}
			/>

			{showLabel && (
				<BottomDrawerMenu
					visible={menuVisible}
					setVisible={setMenuVisible}
					from={titleAnchorRef}
					options={menuOptions}
					activeKey={activeItemKey}
				/>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingLeft: 8,
		paddingRight: 0, // cog flush right, aligned with the map corner components
		marginRight: 0, // align with mapCornerComponents
	},
	headerAbs: {
		alignItems: 'center',
		justifyContent: 'space-between',
		position: 'absolute',
		flexDirection: 'row-reverse',
		width: '100%',
		zIndex: 10,
	},
	title: {
		flexShrink: 1,
		fontWeight: 'bold',
	},
	titleAnchorWrap: {
		flexShrink: 1,
	},
	titleAnchor: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 2,
	},
	statsRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
		marginBottom: 4,
	},
	chartWrap: {
		flex: 1,
	},
	flyToWrap: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		alignItems: 'center',
		justifyContent: 'center',
	},
	text: {
		textAlign: 'center',
	},
});

export default ChartDisplay;
