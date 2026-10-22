/**
 * External dependencies
 */
import { useContext, useState } from 'react';
import { PixelRatio } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useMapEventInterval, useViewportBbox } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { MapContext } from '../../../Context';
import { useAppSelector } from '../../../store/hooks';
import { selectMapUpdateInterval } from '../../general/selectors';
import { selectSelected } from '../selectors';
import { queryLineGeomsBatch } from '../db/queryFns';
import useSimplificationTolerance from '../hooks/useSimplificationTolerance';
import { projectLngLatToCenterDpOffset } from '../../routing/utils';
import { LinePartial } from '../types';

/**
 * Hover threshold for the under-center highlight, in dp — just above the
 * rendered stroke width (3 dp) so the highlight only activates when the
 * map center is visually ON the line.
 */
const LINES_HOVER_THRESHOLD_DP = 4;

/**
 * Returns the ids of all selected lines currently under the map center
 * (point-to-segment screen distance <= {@link LINES_HOVER_THRESHOLD_DP}),
 * as a Set. Multiple lines can overlap at the center position — all of
 * them are included. Includes system lines (routing/track-recording).
 *
 * Performance: candidates come from the same viewport-bbox batch query
 * LinesMapView renders (cache-shared, SQL-side MbrIntersects — only
 * on-screen lines reach the scan), each line's envelope is pre-checked
 * in dp space before its vertices are projected, and state updates only
 * when the set's content changes.
 */
const useLineIdUnderCenter = (): Set<number> => {
	const selectedIds = useAppSelector(selectSelected);
	const mapUpdateInterval = useAppSelector(selectMapUpdateInterval);
	const { currentMapEventRef } = useContext(MapContext);
	const simplify = useSimplificationTolerance();
	const queryBbox = useViewportBbox(currentMapEventRef, mapUpdateInterval);

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
	});

	const [underCenterLineIds, setUnderCenterLineIds] = useState<Set<number>>(() => new Set());

	useMapEventInterval(currentMapEventRef, mapUpdateInterval, (event) => {
		const center = event?.center;
		if (!center || center.length < 2 || !event.zoomLevel || !lines?.length) {
			setUnderCenterLineIds((prev) => (prev.size === 0 ? prev : new Set()));
			return;
		}
		const zoom = event.zoomLevel;
		const tileSize = event.tileSize ?? 576;
		const density = PixelRatio.get();
		const centerLngLat: [number, number] = [center[0], center[1]];
		const thresholdDp = LINES_HOVER_THRESHOLD_DP;

		const hits = new Set<number>();

		for (const line of lines as LinePartial[]) {
			const coords = line?.geometry?.coordinates;
			if (!coords?.length) {
				continue;
			}
			// Envelope pre-check: the closest point of the projected
			// envelope's bounding box is a lower bound of the true line
			// distance — skip vertex projection for far-away lines.
			const ring = line.envelope?.coordinates?.[0];
			if (ring && ring.length >= 4) {
				let minX = Infinity;
				let maxX = -Infinity;
				let minY = Infinity;
				let maxY = -Infinity;
				for (let i = 0; i < ring.length; i++) {
					const [dx, dy] = projectLngLatToCenterDpOffset(
						centerLngLat,
						[ring[i][0], ring[i][1]],
						zoom,
						tileSize,
						density
					);
					if (dx < minX) minX = dx;
					if (dx > maxX) maxX = dx;
					if (dy < minY) minY = dy;
					if (dy > maxY) maxY = dy;
				}
				const clampX = 0 < minX ? minX : 0 > maxX ? -maxX : 0;
				const clampY = 0 < minY ? minY : 0 > maxY ? -maxY : 0;
				if (Math.hypot(clampX, clampY) > thresholdDp) {
					continue;
				}
			}
			// Point-to-segment distance in dp space over consecutive
			// projected vertices — matches the rendered polyline at any
			// zoom (including the gaps between simplified vertices).
			let minDistance = Infinity;
			let prevX: number | undefined;
			let prevY: number | undefined;
			for (const coord of coords) {
				const [dx, dy] = projectLngLatToCenterDpOffset(
					centerLngLat,
					[coord[0], coord[1]],
					zoom,
					tileSize,
					density
				);
				if (prevX !== undefined && prevY !== undefined) {
					const abx = dx - prevX;
					const aby = dy - prevY;
					const abLen2 = abx * abx + aby * aby;
					let fraction = abLen2 > 0 ? -(prevX * abx + prevY * aby) / abLen2 : 0;
					fraction = Math.max(0, Math.min(1, fraction));
					const px = prevX + abx * fraction;
					const py = prevY + aby * fraction;
					const distance = Math.hypot(px, py);
					if (distance < minDistance) {
						minDistance = distance;
					}
				} else {
					const distance = Math.hypot(dx, dy);
					if (distance < minDistance) {
						minDistance = distance;
					}
				}
				prevX = dx;
				prevY = dy;
			}
			if (minDistance <= thresholdDp) {
				hits.add(line.id);
			}
		}

		setUnderCenterLineIds((prev) => {
			if (prev.size === hits.size) {
				let changed = false;
				for (const id of hits) {
					if (!prev.has(id)) {
						changed = true;
						break;
					}
				}
				if (!changed) {
					return prev;
				}
			}
			return hits;
		});
	});

	return underCenterLineIds;
};

export default useLineIdUnderCenter;
