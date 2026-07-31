/**
 * External dependencies
 */
import React, { useContext, useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LayerPath, ReindexScope, SharedLayer, useViewportBbox } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { MapContext } from '../../../Context';
import { useAppDispatch, useAppSelector, useSystemLineIds } from '../../../store/hooks';
import { addBusyKey, removeBusyKey } from '../../ui/slice';
import { selectSelected } from '../selectors';
import { selectMapUpdateInterval } from '../../general/selectors';
import { queryLineGeomsBatch } from '../db/queryFns';
import useSimplificationTolerance from '../hooks/useSimplificationTolerance';

const BASE_STROKE_WIDTH = 5;

const paintSelectedLine = {
	strokeColor: '#ff2222' as `#${string}`,
	strokeWidth: BASE_STROKE_WIDTH,
};

const LinesMapView = () => {
	const selectedIds = useAppSelector(selectSelected);
	const systemLineIds = useSystemLineIds();
	const simplify = useSimplificationTolerance();

	// ── Diagnostics: trace systemLineIds changes ────────────────────
	const prevSystemLineIdsRef = useRef<Record<string, number>>({});
	useEffect(() => {
		if (!__DEV__ || !globalThis.shouldLog.linesMapView) return;
		const prev = prevSystemLineIdsRef.current;
		const keys = Object.keys(systemLineIds);
		const changed =
			keys.length !== Object.keys(prev).length ||
			keys.some((k) => prev[k] !== systemLineIds[k]);
		if (changed) {
			console.log('[LinesMapView] systemLineIds changed:', {
				prev: JSON.stringify(prev),
				next: JSON.stringify(systemLineIds),
			});
		}
		prevSystemLineIdsRef.current = { ...systemLineIds };
	});

	// ── Diagnostics: trace linesToRender changes ────────────────────
	const prevRenderIdsRef = useRef<number[]>([]);
	useEffect(() => {
		if (!__DEV__ || !globalThis.shouldLog.linesMapView) return;
		const prev = prevRenderIdsRef.current;
		const changed =
			prev.length !== linesToRender.length ||
			prev.some((id, i) => id !== linesToRender[i].id);
		if (changed) {
			const prevIds = prev.map((id) => id);
			const nextIds = linesToRender.map((l) => l.id);
			const added = nextIds.filter((id) => !prevIds.includes(id));
			const removed = prevIds.filter((id) => !nextIds.includes(id));
			console.log('[LinesMapView] linesToRender changed:', {
				prevCount: prev.length,
				nextCount: nextIds.length,
				added,
				removed,
				systemIdSet: [...systemIdSet],
				lineCountFromCache: lines?.length ?? 0,
			});
		}
		prevRenderIdsRef.current = [...linesToRender.map((l) => l.id)];
	});

	// ── Diagnostics: trace query key / simplify changes ─────────────
	const prevSimplifyRef = useRef<number | undefined>(undefined);
	useEffect(() => {
		if (!__DEV__ || !globalThis.shouldLog.linesMapView) return;
		if (prevSimplifyRef.current !== simplify) {
			console.log('[LinesMapView] simplify changed:', {
				prev: prevSimplifyRef.current,
				next: simplify,
				selectedCount: selectedIds.length,
				bbox: queryBbox ? `${queryBbox[0].toFixed(4)},${queryBbox[1].toFixed(4)}` : null,
			});
		}
		prevSimplifyRef.current = simplify;
	});

	// Coarse tile-snapped bbox in the query key — DB-side spatial filter
	// with very infrequent key changes (only on ~150 km+ pans).
	const { currentMapEventRef } = useContext(MapContext);
	const mapUpdateInterval = useAppSelector(selectMapUpdateInterval);
	const queryBbox = useViewportBbox(currentMapEventRef, mapUpdateInterval);

	// Batch query with coarse bbox in the key.  DB filters lines outside
	// the snapped bbox before Simplify(); key only changes on large pans.
	const dispatch = useAppDispatch();

	const { data: lines, isFetching } = useQuery({
		queryKey: [
			'lineGeomsBatch',
			selectedIds,
			simplify ?? 0,
			queryBbox,
		] as const,
		queryFn: queryLineGeomsBatch,
		enabled: simplify !== undefined && selectedIds.length > 0,
		gcTime: 1000 * 10,
		placeholderData: (prev) => (selectedIds.length > 0 ? prev : []),
	});

	// Busy key 'lines:load': tracks batch geometry queries from the DB.
	useEffect(() => {
		if (isFetching && selectedIds.length > 0) {
			dispatch(addBusyKey('lines:load'));
		} else {
			dispatch(removeBusyKey('lines:load'));
		}
	}, [
		isFetching,
		selectedIds.length,
		dispatch,
	]);

	const systemIdSet = useMemo(() => {
		const ids = new Set<number>();
		for (const id of Object.values(systemLineIds)) {
			if (id != null) ids.add(id);
		}
		return ids;
	}, [systemLineIds]);

	const linesToRender = useMemo(() => {
		if (!lines) return [];
		return lines.filter((l) => !systemIdSet.has(l.id));
	}, [lines, systemIdSet]);

	const pathElements = useMemo(() => {
		if (simplify === undefined || !lines) return undefined;
		// Build a temporary geometry lookup from the current query result.
		// placeholderData ensures `lines` always holds the last successful
		// fetch during a refetch, so no cross-render cache is needed — the
		// Map is created fresh here and garbage-collected when useMemo
		// recalculates.
		const geomByLineId = new Map<number, number[][]>();
		for (const line of lines) {
			if (line.geometry?.coordinates) {
				geomByLineId.set(line.id, line.geometry.coordinates);
			}
		}
		return linesToRender.map((line) => {
			const coords = geomByLineId.get(line.id);
			if (!coords) return undefined;
			return (
				<LayerPath
					key={line.id}
					coordinates={coords}
					paint={paintSelectedLine}
				/>
			);
		});
	}, [
		linesToRender,
		simplify,
		lines,
	]);

	return (
		<ReindexScope order={200}>
			<SharedLayer>{pathElements}</SharedLayer>
		</ReindexScope>
	);
};

export default LinesMapView;
