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
import BottomDrawerMenu from '../../bottomDrawer/components/BottomDrawerMenu';
import { useBottomDrawerMenuOptions } from '../../bottomDrawer/hooks/useBottomDrawerMenuOptions';
import { AppContext, MapContext } from '../../../Context';
import ButtonHighlight from '../../../components/generic/primitives/ButtonHighlight';
import IconButtonHighlight from '../../../components/generic/primitives/IconButtonHighlight';
import IconCustom from '../../../components/generic/primitives/IconCustom';
import { DRAWER_ICON_SIZE, MAP_ANIMATION_PADDING_PX } from '../../../constants';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { selectPathCoords, selectRoutingLineId } from '../../routing/selectors';
import { selectMapUpdateInterval, selectUnitPrefs } from '../../general/selectors';
import { queryLinePathCoords, queryLinesWithoutGeom } from '../../lines/db/queryFns';
import { haversineDistance } from '../../../lib/formatting';
import LineStats from '../../lines/components/Stats/LineStats';
import { RenderPart } from '../../lines/components/Stats/sharedDeps';
import { LinePartial } from '../../lines/types';
import useRoute from '../../routing/hooks/useRoute';
import { setLineTemp } from '../../lines/slice';
import { getChartSourceFromKey } from '../types';
import { selectChartSettings } from '../selectors';
import { setChartSettings, closeFullscreenChart } from '../slice';
import { useChartItemLabels } from '../hooks/useChartItemLabels';
import { getChartSeries, windowedNearestIdx } from '../utils';
import Chart from './Chart';
import ChartSettingsModal from './ChartSettingsModal/ChartSettingsModal';
import { computeViewportBbox, useMap } from 'react-native-mapsforge-vtm';
const statsRenderParts = ['icon', 'value'] as RenderPart[];
const statsRenderPartsNoIcon = ['value'] as RenderPart[];

export type ChartContentVariant = 'drawer' | 'fullscreen';

const renderRouteCogIcon = ({ color, size }: { color?: string; size?: number }) => (
	<IconCustom
		name="route_cog"
		size={size ?? DRAWER_ICON_SIZE}
		color={color}
	/>
);

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

export interface ChartContentProps {
	chartKey: string;
	settingsModalVisible: boolean;
	setSettingsModalVisible: (visible: boolean) => void;
	variant?: ChartContentVariant;
}

const ChartContent: FC<ChartContentProps> = ({
	chartKey,
	settingsModalVisible,
	setSettingsModalVisible,
	variant = 'drawer',
}) => {
	const theme = useTheme();
	const { t } = useTranslation();

	const { currentMapEventRef } = useContext(MapContext);
	const { mapViewNativeNodeHandle } = useContext(AppContext);
	const { flyToBounds } = useMap(mapViewNativeNodeHandle);

	const source = useMemo(() => getChartSourceFromKey(chartKey), [chartKey]);
	const chartLabels = useChartItemLabels();

	const routingLineId = useAppSelector(selectRoutingLineId);
	const routingCoords = useAppSelector(selectPathCoords);
	const lineId = source?.lineId;
	const isRoutingLine = lineId != null && lineId === routingLineId;

	// The routing line's chart reads the synchronous Redux pathCoords (the
	// same simplified geometry RoutingMapView renders) so it updates and
	// re-fits immediately when the route reprocesses. Other lines read the
	// DB-simplified `linePathCoords` query.
	const { data: lineCoords } = useQuery({
		queryKey: ['linePathCoords', lineId],
		queryFn: queryLinePathCoords,
		enabled: lineId !== undefined && !isRoutingLine,
	});

	// DB (SpatiaLite) stats for the line — the same values every other
	// LineStats usage shows for this route.
	const { data: line } = useQuery({
		queryKey: ['lines', lineId !== undefined ? [lineId] : []],
		queryFn: queryLinesWithoutGeom,
		enabled: lineId !== undefined,
		select: (lines: LinePartial[]) => (lines.length ? lines[0] : null),
	});

	const coordinates: number[][] | undefined = isRoutingLine
		? routingCoords
		: (lineCoords ?? undefined);

	const unitPrefs = useAppSelector(selectUnitPrefs);
	const mapUpdateInterval = useAppSelector(selectMapUpdateInterval);
	const settings = useAppSelector((state) => selectChartSettings(state, chartKey));
	const dispatch = useAppDispatch();

	// The fullscreen chart always shows its heading and statistics; the
	// general show-heading/show-stats toggles only affect drawer charts.
	const displaySettings = useMemo(
		() =>
			variant === 'fullscreen'
				? { ...settings, showHeading: true, showStats: true }
				: settings,
		[variant, settings]
	);

	// Axis gesture settles a new fixed ratio — always written to the
	// active chart.s own entry (the ratio is always per-chart).
	const handleRatioUpdate = useCallback(
		(ratio: number | undefined) => {
			if (ratio == null || !chartKey) {
				return;
			}
			dispatch(setChartSettings({ key: chartKey, settings: { ratioValue: ratio } }));
		},
		[
			dispatch,
			chartKey,
		]
	);

	const series = useMemo(
		() => (coordinates ? getChartSeries(coordinates) : undefined),
		[coordinates]
	);

	// Nearest along-route distance lookup: windowed incremental search
	// with a per-route last-best index (resets when the coordinates
	// array changes) — O(1) typical instead of a full scan per map event.
	const nearestSearchRef = useRef<{
		coords?: number[][];
		idx: number;
		lastTarget?: [number, number];
	}>({ idx: 0 });
	const nearestDistance = useCallback(
		(coordinates: number[][], distances: number[], target: [number, number]): number => {
			const search = nearestSearchRef.current;
			if (search.coords !== coordinates) {
				search.coords = coordinates;
				search.idx = 0;
				search.lastTarget = undefined;
			}
			// First lookup for these coordinates, or a target that jumped
			// far from the last one (e.g. the map was panned away, or a
			// different waypoint) — use a covering window so the result
			// is exact instead of a local minimum.
			const jumped =
				search.lastTarget !== undefined &&
				haversineDistance(search.lastTarget, target) > 1000;
			if (jumped) {
				search.idx = 0;
			}
			const initialWindow =
				search.lastTarget === undefined || jumped ? coordinates.length : 64;
			search.lastTarget = target;
			search.idx = windowedNearestIdx(coordinates, search.idx, target, initialWindow);
			return distances[search.idx];
		},
		[]
	);

	const label = useMemo(() => {
		if (variant === 'fullscreen') {
			return line?.title ?? '';
		}
		return chartKey ? (chartLabels[chartKey] ?? chartKey) : '';
	}, [
		variant,
		line?.title,
		chartKey,
		chartLabels,
	]);

	// Routing waypoints (only when this chart's line is the active routing
	// line). The routing line's stats come from the line itself (SpatiaLite),
	// like every other line.
	const { points } = useRoute(['points']) || {};
	const waypointDistances = useMemo(() => {
		if (!coordinates || !series || !isRoutingLine || !points?.length) {
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
		isRoutingLine,
		points,
		nearestDistance,
	]);

	const stats = useMemo(() => {
		const { length, ...rest } = line?.stats ?? {};
		return { length, rest };
	}, [line?.stats]);

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
	}, [chartKey]);

	// Routing re-fit: while the routing line's chart sits at the natural
	// fit (no stored ratio) and doesn't follow the map, route changes
	// (waypoint edits) re-fit the viewport to the new data.
	useEffect(() => {
		if (isRoutingLine && settings.ratioValue == null && settings.followMode === 'none') {
			setResetSignal((t) => t + 1);
		}
	}, [
		series,
		isRoutingLine,
		settings.ratioValue,
		settings.followMode,
	]);

	// A user gesture on a follow mode switches the option off — the
	// gesture continues from the current viewport.
	const handleUserGesture = useCallback(() => {
		if (!chartKey) {
			return;
		}
		dispatch(setChartSettings({ key: chartKey, settings: { followMode: 'none' } }));
	}, [
		dispatch,
		chartKey,
	]);

	// Fly the map to the route (shown while following with the map panned
	// away from it). The follow derivation re-syncs the chart while the
	// map animates. In the fullscreen UiItem the overlay is closed first
	// so the flight is actually visible.
	const handleFlyToRoute = useCallback(() => {
		if (!mapViewNativeNodeHandle) {
			return;
		}
		const bbox = line?.envelope
			? turfBbox(line.envelope)
			: coordinates && coordinates.length
				? turfBbox({ type: 'LineString', coordinates })
				: undefined;
		if (bbox) {
			if (variant === 'fullscreen') {
				// Close only the fullscreen chart UiItem — any UiItem
				// beneath it (e.g. Settings) stays on the stack.
				dispatch(closeFullscreenChart());
			}
			flyToBounds(bbox, { paddingPx: MAP_ANIMATION_PADDING_PX });
		}
	}, [
		dispatch,
		variant,
		mapViewNativeNodeHandle,
		flyToBounds,
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
		if (settings.followMode !== 'map') {
			setFollowOutOfView(false);
		}
	}, [settings.followMode]);

	// Center indicator: poll the map center (same cadence as the map
	// events). While a follow mode is active with the follow animation
	// on, the cadence is halved — the eased lag glides the indicator
	// between updates, so the per-event re-renders/rasterizations are
	// halved at no visual cost.
	const pollInterval = useMemo(
		() =>
			settings.followMode !== 'none' && settings.animateFollow
				? mapUpdateInterval * 2
				: mapUpdateInterval,
		[
			settings.followMode,
			settings.animateFollow,
			mapUpdateInterval,
		]
	);

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
				settings.followMode === 'map' &&
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
						// Value-compare: keep the previous reference when the
						// range is unchanged so an idle follow-map doesn't
						// re-render the whole tree (incl. the settings
						// modal's popovers) on every map event.
						setFollowRange((prev) =>
							prev && prev[0] === range[0] && prev[1] === range[1] ? prev : range
						);
						setFollowOutOfView(false);
					} else {
						setFollowOutOfView(true);
					}
				}
			}
		}, pollInterval);
		return () => clearInterval(interval);
	}, [
		currentMapEventRef,
		pollInterval,
		settings.followMode,
		coordinates,
		series,
	]);

	// The fullscreen chart visualizes the map center only while it lies
	// inside the line's bounding box; the drawer chart always projects it
	// onto the nearest route point.
	const centerInLineBbox = useMemo(() => {
		if (variant !== 'fullscreen' || !center || !line?.envelope) {
			return true;
		}
		const [
			west,
			south,
			east,
			north,
		] = turfBbox(line.envelope);
		return center[0] >= west && center[0] <= east && center[1] >= south && center[1] <= north;
	}, [
		variant,
		center,
		line?.envelope,
	]);

	const centerDistance = useMemo(
		() =>
			coordinates && series && center && centerInLineBbox
				? nearestDistance(coordinates, series.distances, center)
				: undefined,
		[
			coordinates,
			series,
			center,
			centerInLineBbox,
			nearestDistance,
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

	// Title menu (drawer only): switch the active bottom drawer item
	// (replaces the handle's long-press menu).
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
			// in follow-map mode — the field is hidden then).
			if (settingsModalVisible && settings.followMode !== 'map') {
				setCurrentRatio(ratio);
			}
		},
		[
			settingsModalVisible,
			settings.followMode,
		]
	);
	const [currentRatio, setCurrentRatio] = useState<number | undefined>(undefined);
	const handleOpenSettings = useCallback(() => {
		setCurrentRatio(ratioRef.current);
		setSettingsModalVisible(true);
	}, [setSettingsModalVisible]);

	const handleOpenMenu = useCallback(() => setMenuVisible(true), []);

	// Open the LineEditModal for the dedicated line (fullscreen only) —
	// same trigger the lines lists use.
	const handleOpenLineEdit = useCallback(() => {
		if (variant !== 'fullscreen' || source?.type !== 'line') {
			return;
		}
		dispatch(setLineTemp({ id: source.lineId }));
	}, [
		dispatch,
		variant,
		source,
	]);

	// Keep the modal's ratio snapshot fresh: the chart's ratio changes
	// while a follow mode is active (and on chart switches), but the
	// modal only snapshots it when opened.
	useEffect(() => {
		setCurrentRatio(ratioRef.current);
	}, [
		settings.followMode,
		chartKey,
	]);

	const styleText = useMemo(() => [styles.text, { color: theme.colors.onBackground }], [theme]);

	const styleTitle = useMemo(() => [styles.title, { color: theme.colors.onBackground }], [theme]);

	const lengthStats = useMemo(() => ({ length: stats.length }), [stats.length]);

	if (!series) {
		return (
			<View style={styles.container}>
				<Text style={styleText}>…</Text>
			</View>
		);
	}

	const { showHeading, showStats } = displaySettings;

	const statsNode = hasStats && showStats && (
		<View style={styles.statsRow}>
			{stats.length != null && (
				<LineStats
					stats={lengthStats}
					renderParts={statsRenderPartsNoIcon}
				/>
			)}
			<LineStats
				stats={stats.rest}
				renderParts={statsRenderParts}
			/>
		</View>
	);

	const titleNode = (
		<View style={styles.titleAnchor}>
			<Text
				style={styleTitle}
				numberOfLines={1}
			>
				{label}
			</Text>
			{variant === 'drawer' && (
				<Icon
					source="chevron-down"
					size={16}
					color={theme.colors.onSurfaceVariant}
				/>
			)}
		</View>
	);

	return (
		<View style={styles.container}>
			<View style={showHeading || showStats ? styles.header : styles.headerAbs}>
				{showHeading && (
					<View
						ref={titleAnchorRef}
						collapsable={false}
						style={styles.titleAnchorWrap}
					>
						{variant === 'drawer' ? (
							<TouchableHighlight
								underlayColor={theme.colors.elevation.level3}
								onPress={handleOpenMenu}
							>
								{titleNode}
							</TouchableHighlight>
						) : (
							titleNode
						)}
					</View>
				)}
				{!showHeading && statsNode}
				{variant === 'fullscreen' && source?.type === 'line' ? (
					<View style={styles.headerActions}>
						<IconButtonHighlight
							icon={renderRouteCogIcon}
							accessibilityLabel={t('lines.line')}
							onPress={handleOpenLineEdit}
						/>
						<IconButtonHighlight
							icon="cog"
							onPress={handleOpenSettings}
						/>
					</View>
				) : (
					<IconButtonHighlight
						icon="cog"
						onPress={handleOpenSettings}
					/>
				)}
			</View>

			{showHeading && <View style={styles.header}>{statsNode}</View>}

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
						followRange={settings.followMode === 'map' ? followRange : undefined}
						followOutOfView={settings.followMode === 'map' ? followOutOfView : false}
						onUserGesture={handleUserGesture}
						modalOpen={settingsModalVisible}
					/>
				)}
				{settings.followMode === 'map' && followOutOfView && (
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
				chartKey={chartKey}
				variant={variant}
				currentRatio={currentRatio}
				fitRatio={fitRatio}
				onFitScreen={handleFitScreen}
			/>

			{showHeading && variant === 'drawer' && (
				<BottomDrawerMenu
					visible={menuVisible}
					setVisible={setMenuVisible}
					from={titleAnchorRef}
					options={menuOptions}
					activeKey={chartKey}
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
	headerActions: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	statsRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		flexGrow: 1,
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

export default ChartContent;
