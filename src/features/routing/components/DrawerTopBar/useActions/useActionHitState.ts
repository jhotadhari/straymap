/**
 * External dependencies
 */
import { useCallback, useContext, useMemo, useState } from 'react';
import { PixelRatio } from 'react-native';
import { MapEventResponse, useMapEventInterval } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../../../store/hooks';
import { MapContext } from '../../../../../Context';
import { selectSegments } from '../../../selectors';
import {
	getNearestPointHit,
	getNearestSegmentHit,
	getSegmentRecordId,
	getSimplifiedSegmentCoords,
	resolveProfileForPoint,
} from '../../../utils';
import {
	RoutingGestureHitState,
	RoutingPoint,
	RoutingProfile,
	RoutingSegmentHit,
} from '../../../types';
import { ROUTING_GESTURE_THRESHOLD_DP, ROUTING_SIMPLIFY_TOLERANCE } from '../../../constants';
import { selectMapUpdateInterval } from '../../../../general/selectors';

export type RoutingGestureHits = {
	cutHit: RoutingSegmentHit | null;
	pointHit: { pointId: number } | null;
};

/**
 * Live hit-testing of the map center against the rendered route
 * segments and waypoints.
 *
 * - Simplified segment coordinates are memoized (turf simplify only
 *   runs when segments/points change) — the per-tick work is a cheap
 *   linear scan over those coords.
 * - The returned `hitState` is reduced to what the menu's `disabled`
 *   callbacks need and only updated when the hit target changes, so
 *   the drawer top bar doesn't re-render at the map-update rate.
 * - `getHits` recomputes the full hit (with snapped `nearest`
 *   coordinate) from a live map event, so actions never use stale
 *   geometry when actually run.
 */
const useActionHitState = ({
	points,
	routeProfile,
}: {
	points?: RoutingPoint[];
	routeProfile?: RoutingProfile;
}) => {
	const segments = useAppSelector(selectSegments);
	const mapUpdateInterval = useAppSelector(selectMapUpdateInterval);
	const { currentMapEventRef } = useContext(MapContext);

	const simplifiedByRecordId = useMemo(() => {
		const byRecordId: Record<string, number[][]> = {};
		points?.forEach((fromPoint, index) => {
			const toPoint = points[index + 1];
			if (!toPoint || !routeProfile) {
				return;
			}
			const segmentRecordId = getSegmentRecordId({
				fromId: fromPoint.id,
				toId: toPoint.id,
			});
			const segment = segments[segmentRecordId];
			if (
				!segment ||
				segment.isFetching ||
				segment.errorMsg ||
				(segment.positions?.length ?? 0) < 2
			) {
				return;
			}
			const provider = resolveProfileForPoint(
				fromPoint,
				index,
				points,
				routeProfile
			).provider;
			const simplified = getSimplifiedSegmentCoords(
				segment.positions,
				ROUTING_SIMPLIFY_TOLERANCE,
				provider
			);
			if (simplified) {
				byRecordId[segmentRecordId] = simplified;
			}
		});
		return byRecordId;
	}, [
		points,
		routeProfile,
		segments,
	]);

	const getHits = useCallback(
		(event: MapEventResponse | null): RoutingGestureHits => {
			if (!event?.center || event.center.length < 2 || !event.zoomLevel || !points?.length) {
				return { cutHit: null, pointHit: null };
			}
			const center: [number, number] = [event.center[0], event.center[1]];
			const zoom = event.zoomLevel;
			const tileSize = event.tileSize ?? 576;
			const density = PixelRatio.get();
			return {
				cutHit: getNearestSegmentHit({
					points,
					simplifiedByRecordId,
					center,
					zoom,
					tileSize,
					density,
					thresholdDp: ROUTING_GESTURE_THRESHOLD_DP,
				}),
				pointHit: getNearestPointHit({
					points,
					center,
					zoom,
					tileSize,
					density,
					thresholdDp: ROUTING_GESTURE_THRESHOLD_DP,
				}),
			};
		},
		[points, simplifiedByRecordId]
	);

	const [hitState, setHitState] = useState<RoutingGestureHitState>({
		cutHit: null,
		pointHit: null,
	});

	useMapEventInterval(currentMapEventRef, mapUpdateInterval, (event) => {
		const hits = getHits(event);
		setHitState((prev) => {
			const prevCutKey = prev.cutHit?.segmentRecordId ?? null;
			const nextCutKey = hits.cutHit?.segmentRecordId ?? null;
			const prevPointKey = prev.pointHit?.pointId ?? null;
			const nextPointKey = hits.pointHit?.pointId ?? null;
			if (prevCutKey === nextCutKey && prevPointKey === nextPointKey) {
				return prev;
			}
			return {
				cutHit: hits.cutHit ? { segmentRecordId: hits.cutHit.segmentRecordId } : null,
				pointHit: hits.pointHit ? { pointId: hits.pointHit.pointId } : null,
			};
		});
	});

	return { hitState, getHits };
};

export default useActionHitState;
