/**
 * External dependencies
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { GeometryStyle, LayerPath, ReindexScope, SharedLayer } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../hooks';
import { selectSelected } from '../selectors';
import { selectRoutingLineId } from '../../routing/selectors';
import { selectActiveLineId } from '../../trackRecording/selectors';
import { queryLineGeomsBatch } from '../db/queryFns';
import useSimplificationTolerance from '../hooks/useSimplificationTolerance';

const BASE_STROKE_WIDTH = 5;

const LinesMapView = () => {
	const selected = useAppSelector(selectSelected);
	const routingLineId = useAppSelector(selectRoutingLineId);
	const recordingLineId = useAppSelector(selectActiveLineId);
	const simplify = useSimplificationTolerance();

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

	// Single batch query — one DB call instead of N per-line queries.
	// Viewport culling is left to VTM's native drawable-visibility logic.
	const { data: lines } = useQuery({
		queryKey: [
			'lineGeomsBatch',
			selectedIds,
			simplify ?? 0,
		] as const,
		queryFn: queryLineGeomsBatch,
		enabled: simplify !== undefined && selectedIds.length > 0,
		gcTime: 1000 * 10,
		placeholderData: keepPreviousData,
	});

	// Persistent coordinate cache — only updated when coordinates actually
	// change, so LayerPath receives stable references.
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

	// Exclude routing / recording / hidden lines.
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

	// Memoize the entire path subtree so map-event-driven re-renders
	// don't touch the native LayerPath elements.
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
