/**
 * External dependencies
 */
import React, { FC, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import BottomDrawerContext from '../../bottomDrawer/BottomDrawerContext';
import { MapContext } from '../../../Context';
import IconButtonHighlight from '../../../components/generic/primitives/IconButtonHighlight';
import { useAppSelector } from '../../../store/hooks';
import { selectPathCoords } from '../../routing/selectors';
import { selectMapUpdateInterval, selectUnitPrefs } from '../../general/selectors';
import { queryLinePathCoords } from '../../lines/db/queryFns';
import { haversineDistance, formatDistance, formatHeightDepth } from '../../../lib/formatting';
import useRoute from '../../routing/hooks/useRoute';
import { getProfileSourceFromKey } from '../types';
import { selectProfileSettings } from '../selectors';
import { useProfileItemLabels } from '../hooks/useProfileItemLabels';
import { getProfileSeries } from '../utils';
import AltitudeProfileChart from './AltitudeProfileChart';
import ProfileSettingsModal from './ProfileSettingsModal';

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
	const { t } = useTranslation();

	const { activeItemKey } = useContext(BottomDrawerContext);
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

	const coordinates: number[][] | undefined =
		source?.type === 'routing' ? routingCoords : (lineCoords ?? undefined);

	const unitPrefs = useAppSelector(selectUnitPrefs);
	const mapUpdateInterval = useAppSelector(selectMapUpdateInterval);
	const settings = useAppSelector((state) => selectProfileSettings(state, activeItemKey));

	const distancePref = useMemo(
		() => unitPrefs.distance ?? { unit: 'metric', round: 1 },
		[unitPrefs]
	);
	const heightPref = useMemo(() => unitPrefs.heightDepth ?? { unit: 'm', round: 0 }, [unitPrefs]);

	const series = useMemo(
		() => (coordinates ? getProfileSeries(coordinates) : undefined),
		[coordinates]
	);

	const label = useMemo(
		() => (activeItemKey ? (profileLabels[activeItemKey] ?? activeItemKey) : ''),
		[activeItemKey, profileLabels]
	);

	// Routing waypoints (routing source only).
	const { points } = useRoute(['points']) || {};
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

	const [settingsVisible, setSettingsVisible] = useState(false);

	if (!series) {
		return (
			<View style={styles.container}>
				<Text style={[styles.text, { color: theme.colors.onBackground }]}>…</Text>
			</View>
		);
	}

	const { stats } = series;

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Text
					style={[styles.title, { color: theme.colors.onBackground }]}
					numberOfLines={1}
				>
					{label}
				</Text>
				<IconButtonHighlight
					icon="cog"
					onPress={() => setSettingsVisible(true)}
				/>
			</View>

			<Text style={[styles.stats, { color: theme.colors.onSurfaceVariant }]}>
				{`${t('altitudeProfile.statUphill')} ${formatHeightDepth(stats.uphill, heightPref)}  ${t('altitudeProfile.statDownhill')} ${formatHeightDepth(stats.downhill, heightPref)}  ${t('altitudeProfile.statLength')} ${formatDistance(stats.length, distancePref)}  ${formatHeightDepth(stats.minZ, heightPref)}–${formatHeightDepth(stats.maxZ, heightPref)}`}
			</Text>

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
				visible={settingsVisible}
				setVisible={setSettingsVisible}
				profileKey={activeItemKey ?? ''}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 8,
		paddingBottom: 8,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginTop: 4,
	},
	title: {
		flexShrink: 1,
		fontWeight: 'bold',
	},
	stats: {
		fontSize: 11,
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
