/**
 * External dependencies
 */
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { GeometryStyle, LayerPath, ReindexScope, SharedLayer } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { MapContext } from '../../../Context';
import { useAppSelector } from '../../../store/hooks';
import { selectSelected } from '../selectors';
import { selectRoutingLineId } from '../../routing/selectors';
import { selectActiveLineId } from '../../trackRecording/selectors';
import { selectMapUpdateInterval } from '../../general/selectors';
import { queryLineGeomsBatch } from '../db/queryFns';
import useSimplificationTolerance from '../hooks/useSimplificationTolerance';
import { computeViewportBbox, ViewportBbox, snapBboxToTiles } from '../../../compose/mercatorMath';

const BASE_STROKE_WIDTH = 5;

const bboxKey = (bbox: ViewportBbox | null): string =>
	bbox ? `${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]}` : 'null';

/**
 * Tile zoom for bbox snapping — capped at 8 (~150 km tiles) so pans
 * smaller than that don't change the query key, but the DB still
 * filters out lines on other continents.
 */
const snapTileZoom = (mapZoom: number): number => Math.min(8, Math.max(0, Math.floor(mapZoom - 4)));

const LinesMapView = () => {
	const selected = useAppSelector(selectSelected);
	const routingLineId = useAppSelector(selectRoutingLineId);
	const recordingLineId = useAppSelector(selectActiveLineId);
	const simplify = useSimplificationTolerance();

	// Coarse tile-snapped bbox in the query key — DB-side spatial filter
	// with very infrequent key changes (only on ~150 km+ pans).
	const { currentMapEventRef } = useContext(MapContext);
	const mapUpdateInterval = useAppSelector(selectMapUpdateInterval);
	const [queryBbox, setQueryBbox] = useState<ViewportBbox | null>(null);

	const bboxTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const lastBboxKeyRef = useRef<string | null>(null);
	useEffect(() => {
		const scheduleBbox = () => {
			if (bboxTimeoutRef.current) return;
			const evt = currentMapEventRef?.current;
			if (
				!evt?.center ||
				evt.center.length < 2 ||
				evt.zoomLevel == null ||
				!evt.viewportWidth ||
				!evt.viewportHeight
			) {
				return;
			}
			bboxTimeoutRef.current = setTimeout(() => {
				bboxTimeoutRef.current = null;
				const fresh = currentMapEventRef?.current;
				if (
					!fresh?.center ||
					fresh.center.length < 2 ||
					fresh.zoomLevel == null ||
					!fresh.viewportWidth ||
					!fresh.viewportHeight
				) {
					return;
				}
				let bbox = computeViewportBbox(
					fresh.center as [number, number],
					fresh.zoomLevel!,
					fresh.viewportWidth!,
					fresh.viewportHeight!,
					fresh.bearing ?? 0,
					fresh.tilt ?? 0
				);
				if (bbox) {
					bbox = snapBboxToTiles(bbox, snapTileZoom(fresh.zoomLevel!));
				}
				const key = bboxKey(bbox);
				if (key !== lastBboxKeyRef.current) {
					lastBboxKeyRef.current = key;
					setQueryBbox(bbox);
				}
			}, 100);
		};
		const interval = setInterval(scheduleBbox, mapUpdateInterval);
		return () => {
			clearInterval(interval);
			if (bboxTimeoutRef.current) clearTimeout(bboxTimeoutRef.current);
		};
	}, [currentMapEventRef, mapUpdateInterval]);

	const selectedIds = selected;

	// Batch query with coarse bbox in the key.  DB filters lines outside
	// the snapped bbox before Simplify(); key only changes on large pans.
	const { data: lines } = useQuery({
		queryKey: [
			'lineGeomsBatch',
			selectedIds,
			simplify ?? 0,
			queryBbox,
		] as const,
		queryFn: queryLineGeomsBatch,
		enabled: simplify !== undefined && selectedIds.length > 0,
		gcTime: 1000 * 10,
		placeholderData: keepPreviousData,
	});

	const coordsCacheRef = useRef<Map<number, number[][]>>(new Map());
	if (lines) {
		const cache = coordsCacheRef.current;
		for (const line of lines) {
			const next = line.geometry?.coordinates;
			if (!next) continue;
			const prev = cache.get(line.id);
			if (!prev || prev.length !== next.length || prev[0]?.[0] !== next[0]?.[0]) {
				cache.set(line.id, next);
			}
		}
	}

	const linesToRender = useMemo(() => {
		if (!lines) return [];
		return lines.filter((l) => l.id !== routingLineId && l.id !== recordingLineId);
	}, [
		lines,
		routingLineId,
		recordingLineId,
	]);

	const pathElements = useMemo(() => {
		if (simplify === undefined) return undefined;
		return linesToRender.map((line) => {
			const coords = coordsCacheRef.current.get(line.id);
			if (!coords) return undefined;
			return (
				<LayerPath
					key={line.id}
					coordinates={coords}
					style={{
						strokeColor: '#ff2222' as `#${string}`,
						strokeWidth: BASE_STROKE_WIDTH,
					}}
				/>
			);
		});
	}, [linesToRender, simplify]);

	return (
		<ReindexScope order={200}>
			<SharedLayer>{pathElements}</SharedLayer>
		</ReindexScope>
	);
};

export default LinesMapView;
