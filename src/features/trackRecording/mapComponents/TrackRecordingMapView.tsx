/**
 * External dependencies
 */
import React, { FC, useEffect, useMemo, useState } from 'react';
import { PixelRatio } from 'react-native';
import { Marker, ReindexScope, SharedLayer } from 'react-native-mapsforge-vtm';
import { useQuery } from '@tanstack/react-query';
import {
	bearing as turfBearing,
	lineChunk,
	lineString,
	simplify as turfSimplify,
} from '@turf/turf';
import RNFS from 'react-native-fs';
import { get } from 'lodash-es';
import type { Position } from 'geojson';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../store/hooks';
import { selectTrackLineId, selectLineWidth } from '../selectors';
import { queryLineGeom } from '../../lines/db/queryFns';
import useSimplificationTolerance from '../../lines/hooks/useSimplificationTolerance';
import useMapZoomLevel from '../../../compose/useMapZoomLevel';
import { selectAppDirs } from '../../dirs/selectors';
import { logError } from '../../../lib/utils';
import { PALETTE_COLORS } from '../../../constants';
import { buildRecordingChevronSvg, recordingChevronSizeDp } from '../chevronSvg';

const CHEVRON_FILE_NAME = 'recordingChevron.svg';

/** Spacing between chevron canvases: edge-to-edge (near-zipper look).
 * The glyph's internal margins leave a sliver of gap; use a factor
 * below 1 for a slight overlap. */
const CHEVRON_GAP_FACTOR = 0.4;

/** Hard cap on chevron markers per render (very long recordings get a
 * uniformly coarser spacing instead of dropping markers). */
const MAX_MARKERS = 1000;

const WORLD_CIRCUMFERENCE_M = 40075016.686;
const TILE_SIZE_PX = 256;

const metersPerPixel = (zoom: number) => WORLD_CIRCUMFERENCE_M / (TILE_SIZE_PX * Math.pow(2, zoom));

interface ChevronMarker {
	position: [number, number];
	rotation: number;
}

const TrackRecordingMapView: FC = () => {
	const lineId = useAppSelector(selectTrackLineId);
	const lineWidth = useAppSelector(selectLineWidth);
	const simplify = useSimplificationTolerance();
	const zoomLevel = useMapZoomLevel();
	const appDirs = useAppSelector(selectAppDirs);
	const markerDir = get(appDirs, ['marker', 0]) as string | undefined;

	const [filePath, setFilePath] = useState<string | null>(null);

	// Write the chevron SVG into the app's marker dir — the native marker
	// decodes .svg filePaths directly (same flow as GnssCenterMarker).
	// Rewritten whenever the line width changes so the chevron scales.
	useEffect(() => {
		if (!markerDir) {
			return;
		}
		const path = `${markerDir}/${CHEVRON_FILE_NAME}`;
		let cancelled = false;
		(async () => {
			try {
				await RNFS.writeFile(
					path,
					buildRecordingChevronSvg(lineWidth, PALETTE_COLORS[0].bg),
					'utf8'
				);
				if (!cancelled) {
					setFilePath(path);
				}
			} catch (err) {
				logError('trackRecording/TrackRecordingMapView.svg', err);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [markerDir, lineWidth]);

	// The native marker canvas is raw pixels — scale dp by density.
	const sizePx = useMemo(
		() => Math.round(recordingChevronSizeDp(lineWidth) * PixelRatio.get()),
		[lineWidth]
	);

	const { data: line } = useQuery({
		queryKey: [
			'lineGeom',
			lineId ?? -1,
		],
		queryFn: queryLineGeom,
		enabled: lineId != null,
		gcTime: 1000 * 10,
	});

	// Zoom-adaptive simplification: keeps the geometry sane for sampling
	// and bearings at low zoom (same ladder as the lines feature).
	const coordinates = useMemo(() => {
		const coords = line?.geometry?.coordinates;
		if (!coords || coords.length < 2) {
			return undefined;
		}
		if (simplify == null) {
			return coords;
		}
		const result = turfSimplify(lineString(coords), {
			tolerance: simplify,
			highQuality: false,
		});
		return result.geometry.coordinates;
	}, [line?.geometry?.coordinates, simplify]);

	// Recompute on 0.25 zoom buckets: spacing is placed in meters and
	// rendered at the actual fractional zoom, so rounding the zoom to
	// integers made the on-screen gap swing by 2^±0.5 and flip at the
	// .5 boundary. Quarter-zoom buckets cap the error at ~±9% with at
	// most 4 recomputes per zoom level.
	const zoomBucket = zoomLevel == null ? null : Math.round(zoomLevel * 4) / 4;

	// One chevron per line chunk at zoom-scaled spacing; each chunk's
	// bearing orients its chevron along the recorded travel direction.
	const chevronMarkers = useMemo<ChevronMarker[]>(() => {
		if (!coordinates || coordinates.length < 2 || zoomBucket == null) {
			return [];
		}
		const chevronGapPx = sizePx * CHEVRON_GAP_FACTOR;
		let spacingMeters = chevronGapPx * metersPerPixel(zoomBucket);
		let chunks = lineChunk(lineString(coordinates), spacingMeters, {
			units: 'meters',
		});
		if (chunks.features.length > MAX_MARKERS) {
			const factor = Math.ceil(chunks.features.length / MAX_MARKERS);
			spacingMeters *= factor;
			chunks = lineChunk(lineString(coordinates), spacingMeters, {
				units: 'meters',
			});
		}
		const markers: ChevronMarker[] = [];
		for (const chunk of chunks.features) {
			const chunkCoords = chunk.geometry.coordinates as Position[];
			if (chunkCoords.length < 2) {
				continue;
			}
			const start = chunkCoords[0] as [number, number];
			const end = chunkCoords[chunkCoords.length - 1] as [number, number];
			const rotationDeg = turfBearing(start, end);
			if (!Number.isFinite(rotationDeg)) {
				continue;
			}
			markers.push({
				position: end,
				rotation: (rotationDeg + 360) % 360,
			});
		}
		return markers;
	}, [
		coordinates,
		zoomBucket,
		sizePx,
	]);

	if (!filePath || chevronMarkers.length === 0) {
		return <ReindexScope order={310}>{null}</ReindexScope>;
	}

	const paint = {
		width: sizePx,
		height: sizePx,
		filePath: filePath as `/${string}` | `content://${string}`,
		hotspotPlace: 'CENTER' as const,
		rotation: 0,
	};

	return (
		<ReindexScope order={310}>
			<SharedLayer>
				{chevronMarkers.map((marker, index) => (
					<Marker
						key={`${marker.position[0]}-${marker.position[1]}-${index}`}
						position={marker.position}
						paint={{
							...paint,
							rotation: marker.rotation,
						}}
						onError={(err) =>
							logError('trackRecording/TrackRecordingMapView.marker', err)
						}
					/>
				))}
			</SharedLayer>
		</ReindexScope>
	);
};

export default TrackRecordingMapView;
