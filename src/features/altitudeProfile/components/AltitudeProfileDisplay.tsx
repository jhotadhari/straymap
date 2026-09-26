/**
 * External dependencies
 */
import React, { FC, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, TouchableHighlight, View } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';

/**
 * Internal dependencies
 */
import BottomDrawerContext from '../../bottomDrawer/BottomDrawerContext';
import BottomDrawerMenu from '../../bottomDrawer/components/BottomDrawerMenu';
import { useBottomDrawerMenuOptions } from '../../bottomDrawer/hooks/useBottomDrawerMenuOptions';
import { MapContext } from '../../../Context';
import IconButtonHighlight from '../../../components/generic/primitives/IconButtonHighlight';
import { useAppSelector } from '../../../store/hooks';
import { selectPathCoords } from '../../routing/selectors';
import { selectMapUpdateInterval, selectUnitPrefs } from '../../general/selectors';
import { queryLinePathCoords, queryLinesWithoutGeom } from '../../lines/db/queryFns';
import { haversineDistance } from '../../../lib/formatting';
import LineStats from '../../lines/components/Stats/LineStats';
import { RenderPart } from '../../lines/components/Stats/sharedDeps';
import { LinePartial } from '../../lines/types';
import useRoute from '../../routing/hooks/useRoute';
import { getProfileSourceFromKey } from '../types';
import { selectProfileSettings } from '../selectors';
import { useProfileItemLabels } from '../hooks/useProfileItemLabels';
import { getProfileSeries } from '../utils';
import AltitudeProfileChart from './AltitudeProfileChart';
import ProfileSettingsModal from './ProfileSettingsModal/ProfileSettingsModal';

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

const AltitudeProfileDisplay: FC = () => {
	const theme = useTheme();

	const { activeItemKey, settingsModalVisible, setSettingsModalVisible } =
		useContext(BottomDrawerContext);
	const { currentMapEventRef } = useContext(MapContext);

	const source = useMemo(() => getProfileSourceFromKey(activeItemKey), [activeItemKey]);
	const profileLabels = useProfileItemLabels();

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
	const settings = useAppSelector((state) => selectProfileSettings(state, activeItemKey));

	const series = useMemo(
		() => (coordinates ? getProfileSeries(coordinates) : undefined),
		[coordinates]
	);

	const label = useMemo(
		() => (activeItemKey ? (profileLabels[activeItemKey] ?? activeItemKey) : ''),
		[activeItemKey, profileLabels]
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
		}, mapUpdateInterval);
		return () => clearInterval(interval);
	}, [currentMapEventRef, mapUpdateInterval]);

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
					onPress={() => setSettingsModalVisible(true)}
				/>
			</View>

			{showLabel && <View style={styles.header}>{statsNode}</View>}

			<View
				style={styles.chartWrap}
				onLayout={handleChartLayout}
			>
				{chartSize.width > 0 && chartSize.height > 0 && (
					<AltitudeProfileChart
						series={series}
						width={chartSize.width}
						height={chartSize.height}
						settings={settings}
						unitPrefs={unitPrefs}
						waypointDistances={waypointDistances}
						centerDistance={centerDistance}
					/>
				)}
			</View>

			<ProfileSettingsModal
				visible={settingsModalVisible}
				setVisible={setSettingsModalVisible}
				profileKey={activeItemKey ?? ''}
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
		paddingRight: 8,
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
	text: {
		textAlign: 'center',
	},
});

export default AltitudeProfileDisplay;
