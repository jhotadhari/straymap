/**
 * External dependencies
 */
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { GeometryStyle, LayerPath, ReindexScope, SharedLayer } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { MapContext } from '../../../../Context';
import { useAppSelector } from '../../../hooks';
import { selectSelected } from '../selectors';
import { selectRoutingLineId } from '../../routing/selectors';
import { selectActiveLineId } from '../../trackRecording/selectors';
import { selectMapUpdateInterval } from '../../general/selectors';
import { queryLineGeomsBatch } from '../db/queryFns';
import useSimplificationTolerance from '../hooks/useSimplificationTolerance';
import {
	computeViewportBbox,
	ViewportBbox,
	snapBboxToTiles,
} from '../../../../compose/mercatorMath';

const BASE_STROKE_WIDTH = 5;

const bboxKey = (bbox: ViewportBbox | null): string =>
	bbox ? `${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]}` : 'null';

const LinesMapView = () => {
	const selected = useAppSelector(selectSelected);
	const routingLineId = useAppSelector(selectRoutingLineId);
	const recordingLineId = useAppSelector(selectActiveLineId);
	const simplify = useSimplificationTolerance();

	// Viewport geographic bounding box for DB-side culling.
	const { currentMapEventRef } = useContext(MapContext);
	const mapUpdateInterval = useAppSelector(selectMapUpdateInterval);
	const [viewportBbox, setViewportBbox] = useState<ViewportBbox | null>(null);

	// Throttled bbox computation.
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
					const tileZoom = Math.max(0, Math.floor(fresh.zoomLevel!) - 3);
					bbox = snapBboxToTiles(bbox, tileZoom);
				}
				const key = bboxKey(bbox);
				if (key !== lastBboxKeyRef.current) {
					lastBboxKeyRef.current = key;
					setViewportBbox(bbox);
				}
			}, 100);
		};

		const interval = setInterval(scheduleBbox, mapUpdateInterval);
		return () => {
			clearInterval(interval);
			if (bboxTimeoutRef.current) clearTimeout(bboxTimeoutRef.current);
		};
	}, [currentMapEventRef, mapUpdateInterval]);

	// Stable derived values from Redux.
	const { selectedIds, visibleMap } = useMemo(
		() => ({
			selectedIds: selected.map((a) => a.id),
			visibleMap: selected.reduce<Record<string, boolean>>((acc, a) => {
				acc[a.id] = a.visible;
				return acc;
			}, {}),
		}),
		[selected]
	);

	// Single batch query.
	const { data: lines } = useQuery({
		queryKey: [
			'lineGeomsBatch',
			selectedIds,
			simplify ?? 0,
			viewportBbox,
		] as const,
		queryFn: queryLineGeomsBatch,
		enabled: simplify !== undefined && selectedIds.length > 0,
		gcTime: 1000 * 10,
		placeholderData: keepPreviousData,
	});

	// Persistent coordinate cache.  Only updated when coordinates actually
	// change (length + first-point heuristic), so LayerPath receives stable
	// references and skips unnecessary native updates.
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

	// Exclude routing / recording / hidden lines.  Viewport culling is done
	// by the DB via MbrIntersects.
	const linesToRender = useMemo(() => {
		if (!lines) return [];
		return lines.filter(
			(l) => l.id !== routingLineId && l.id !== recordingLineId && visibleMap[l.id]
		);
	}, [
		lines,
		routingLineId,
		recordingLineId,
		visibleMap,
	]);

	// Memoize the entire path subtree so map-event-driven re-renders at
	// ~25 Hz don't touch the native LayerPath elements at all.
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

	useEffect(() => {

		console.log( 'debug linesToRender, simplify', linesToRender, simplify ); // debug
	}, [linesToRender, simplify])

	return (
		<ReindexScope order={200}>
			<SharedLayer>{pathElements}</SharedLayer>
		</ReindexScope>
	);
};

export default LinesMapView;
